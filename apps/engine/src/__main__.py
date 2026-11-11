"""Electron owns this process; stdin EOF terminates orphaned engine processes."""

import json
import logging
import os
import socket
import sys
import threading
from pathlib import Path


def main() -> None:
    from .contract import LOOPBACK_HOST, PROTOCOL_VERSION

    bootstrap = json.loads(sys.stdin.readline())
    secret = bootstrap["secret"]
    if not isinstance(secret, str) or len(secret) < 32:
        raise ValueError("An engine session secret is required.")
    root = Path(bootstrap["root"]).resolve()
    logs = root / "logs"
    os.umask(0o077)
    logs.mkdir(parents=True, exist_ok=True)
    os.environ["HF_HUB_DISABLE_TELEMETRY"] = "1"
    os.environ["HF_HUB_DISABLE_XET"] = "1"
    os.environ["DO_NOT_TRACK"] = "1"
    os.environ["TORCH_FORCE_WEIGHTS_ONLY_LOAD"] = "1"
    os.environ.setdefault("PYTORCH_ENABLE_MPS_FALLBACK", "1")
    os.environ.setdefault("NUMBA_CACHE_DIR", str(root / "cache" / "numba"))
    from logging.handlers import RotatingFileHandler

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
        handlers=[
            RotatingFileHandler(logs / "engine.log", maxBytes=2_000_000, backupCount=3),
            logging.StreamHandler(sys.stderr),
        ],
    )
    import torch
    import uvicorn

    from .server import create_app

    torch.set_num_threads(min(6, os.cpu_count() or 1))
    listener = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    listener.bind((LOOPBACK_HOST, 0))
    # Queue the first authenticated request while Uvicorn finishes ASGI startup.
    listener.listen(128)
    port = listener.getsockname()[1]

    def ready():
        print(json.dumps({"phonivraEngine": PROTOCOL_VERSION, "port": port}), flush=True)

    app = create_app(root, secret, ready)
    server = uvicorn.Server(
        uvicorn.Config(
            app, access_log=False, log_config=None, proxy_headers=False, timeout_graceful_shutdown=3
        )
    )

    def watch_parent():
        for _line in sys.stdin:
            pass
        server.should_exit = True

    threading.Thread(target=watch_parent, daemon=True, name="desktop-lifetime").start()
    server.run(sockets=[listener])


if __name__ == "__main__":
    main()
