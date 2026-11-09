"""Keep-Alive Background Daemon to prevent server idle spin-downs on cloud platforms."""

from __future__ import annotations

import logging
import os
import threading
import urllib.request
import urllib.error

logger = logging.getLogger(__name__)


class KeepAliveDaemon:
    """Sends periodic heartbeats to maintain active container state on serverless/free cloud hosts."""

    def __init__(self, target_url: str | None = None, interval_seconds: int = 500) -> None:
        self.target_url = target_url or os.getenv(
            "KEEP_ALIVE_URL",
            "https://aifeedback-web-app.onrender.com/api/v1/health",
        )
        self.interval_seconds = int(os.getenv("KEEP_ALIVE_INTERVAL_SECONDS", str(interval_seconds)))
        self._stop_event = threading.Event()
        self._thread: threading.Thread | None = None

    def start(self) -> None:
        """Starts the keep-alive background worker thread."""
        if self._thread is not None and self._thread.is_alive():
            return

        self._stop_event.clear()
        self._thread = threading.Thread(target=self._run, name="PRI-KeepAliveDaemon", daemon=True)
        self._thread.start()
        logger.info(
            "KeepAliveDaemon started. Target URL: %s | Interval: %ds",
            self.target_url,
            self.interval_seconds,
        )

    def stop(self) -> None:
        """Signals the worker thread to stop cleanly."""
        self._stop_event.set()
        if self._thread is not None:
            self._thread.join(timeout=3.0)
            self._thread = None
            logger.info("KeepAliveDaemon stopped.")

    def _run(self) -> None:
        """Loop that pings the target health URL every interval."""
        # Initial grace period allowing the application to finish boot
        if self._stop_event.wait(30.0):
            return

        while not self._stop_event.is_set():
            try:
                req = urllib.request.Request(
                    self.target_url,
                    headers={
                        "User-Agent": "PRI-KeepAliveDaemon/1.0",
                        "Accept": "application/json",
                    },
                )
                with urllib.request.urlopen(req, timeout=12.0) as resp:
                    logger.debug("KeepAlive heartbeat acknowledged: HTTP %s", resp.status)
            except urllib.error.HTTPError as http_err:
                logger.debug("KeepAlive received HTTP response: %s", http_err.code)
            except Exception as exc:
                logger.debug("KeepAlive transient ping exception (non-fatal): %s", exc)

            # Wait for the next interval or exit early if stopped
            if self._stop_event.wait(self.interval_seconds):
                break


# Global singleton instance
keep_alive_daemon = KeepAliveDaemon()
