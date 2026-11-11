"""Authenticated loopback transport. Only Electron receives the session secret."""

import hmac
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse, Response

from .contract import MAX_REQUEST_BYTES
from .schemas import Command, DesktopOperation
from .studio import Studio

log = logging.getLogger(__name__)


def create_app(root: Path, secret: str, ready) -> FastAPI:
    studio = Studio(root)

    @asynccontextmanager
    async def lifespan(_app: FastAPI):
        ready()
        yield
        studio.close()

    app = FastAPI(lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None)

    @app.middleware("http")
    async def authenticate(request: Request, call_next):
        provided = request.headers.get("authorization", "")
        if request.headers.get("origin") or not hmac.compare_digest(
            provided.encode(), f"Bearer {secret}".encode()
        ):
            return JSONResponse({"detail": "Unauthorized"}, status_code=401)
        length = request.headers.get("content-length")
        if request.headers.get("transfer-encoding") or (
            request.method == "POST" and length is None
        ):
            return JSONResponse({"detail": "A fixed request length is required"}, status_code=411)
        if length is not None and (
            not length.isascii()
            or not length.isdigit()
            or len(length) > len(str(MAX_REQUEST_BYTES))
            or int(length) > MAX_REQUEST_BYTES
        ):
            return JSONResponse({"detail": "Request too large"}, status_code=413)
        return await call_next(request)

    @app.exception_handler(ValueError)
    async def invalid(_request, error):
        return JSONResponse({"detail": str(error)}, status_code=400)

    @app.exception_handler(OSError)
    async def filesystem_error(_request, error):
        log.exception("File operation failed")
        return JSONResponse({"detail": str(error)}, status_code=400)

    @app.get("/snapshot")
    def snapshot(after: int = -1):
        with studio.lock:
            if studio.revision == after:
                return Response(status_code=204)
            return studio.snapshot()

    @app.post("/command")
    def command(value: Command):
        return studio.dispatch(value)

    @app.post("/desktop")
    def desktop(value: DesktopOperation):
        if value.operation != "credential.restore" and not value.paths:
            raise ValueError("A selected path is required.")
        return studio.desktop(value)

    @app.api_route("/media/{media_id:path}", methods=["GET", "HEAD"])
    def media(media_id: str):
        with studio.lock:
            path = studio.library.media_path(media_id)
        return FileResponse(path, headers={"Cache-Control": "no-store"})

    @app.get("/waveform/{media_id:path}")
    def waveform(media_id: str):
        from .audio import waveform as extract_waveform

        with studio.lock:
            path = studio.library.media_path(media_id)
        return extract_waveform(path, studio.storage.temporary)

    @app.get("/paths")
    def paths():
        return {
            "outputs": str(studio.storage.outputs),
            "models": str(studio.models.root),
            "logs": str(studio.storage.logs),
        }

    return app
