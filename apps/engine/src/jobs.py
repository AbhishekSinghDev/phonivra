"""One serialized compute job; responsive control requests use a separate lock."""

import logging
import threading
import time
from collections.abc import Callable
from concurrent.futures import ThreadPoolExecutor
from uuid import uuid4

log = logging.getLogger(__name__)


class Cancelled(Exception):
    pass


class Jobs:
    def __init__(self, update: Callable[..., None]):
        self.update = update
        self.cancelled = threading.Event()
        self.resumed = threading.Event()
        self.resumed.set()
        self.pool = ThreadPoolExecutor(max_workers=1, thread_name_prefix="phonivra-inference")
        self.future = None
        self.started = 0.0
        self.lock = threading.Lock()
        self.download_id: str | None = None

    @property
    def busy(self) -> bool:
        return self.future is not None and not self.future.done()

    def require_idle(self) -> None:
        if self.busy:
            raise ValueError("Wait for the current job to finish, or stop it first.")

    def checkpoint(self) -> None:
        while not self.resumed.wait(0.2):
            if self.cancelled.is_set():
                raise Cancelled()
        if self.cancelled.is_set():
            raise Cancelled()

    def progress(self, phase: str, value: float, message: str, **extra) -> None:
        self.checkpoint()
        self.update(
            phase=phase,
            progress=max(0, min(100, value)),
            message=message,
            elapsed=round(time.monotonic() - self.started, 1),
            **extra,
        )

    def start(self, kind: str, title: str, work: Callable[[], None]) -> None:
        with self.lock:
            self.require_idle()
            self.cancelled.clear()
            self.resumed.set()
            self.started = time.monotonic()
            self.update(
                id=uuid4().hex,
                kind=kind,
                phase="queued",
                progress=0,
                title=title,
                message="Starting…",
                part=0,
                total=0,
                elapsed=0,
                remaining=None,
                streaming="unavailable",
                paused=False,
            )
            self.future = self.pool.submit(self._run, work)

    def _run(self, work: Callable[[], None]) -> None:
        try:
            work()
            self.progress("complete", 100, "Finished.")
        except Cancelled:
            self.update(
                phase="stopped", message="Stopped. Unfinished audio was discarded.", paused=False
            )
        except Exception as error:
            log.exception("Local engine job failed")
            self.update(phase="error", message=str(error) or type(error).__name__, paused=False)
        finally:
            self.download_id = None

    def cancel(self) -> None:
        if self.busy:
            self.cancelled.set()
            self.resumed.set()
            self.update(
                phase="stopping", message="Stopping after the current operation…", paused=False
            )

    def pause(self, model_id: str, paused: bool) -> None:
        if not self.busy or self.download_id != model_id:
            raise ValueError("That model is not downloading.")
        if paused:
            self.resumed.clear()
        else:
            self.resumed.set()
        self.update(paused=paused, message="Download paused." if paused else "Resuming download…")

    def close(self) -> None:
        self.cancel()
        self.pool.shutdown(wait=False, cancel_futures=True)
