"""Standalone Durable Review Worker Process CLI (Phase 2).

Usage:
    python -m backend.app.worker
"""

from __future__ import annotations

import logging
import signal
import sys
import time

from backend.app.services.review_worker import review_worker

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("review_worker_process")


def main() -> None:
    logger.info("Starting standalone Durable Review Worker process...")
    review_worker.start()

    def handle_shutdown(signum, frame):
        logger.info("Signal %s received; shutting down worker process...", signum)
        review_worker.stop()
        sys.exit(0)

    signal.signal(signal.SIGINT, handle_shutdown)
    if hasattr(signal, "SIGTERM"):
        signal.signal(signal.SIGTERM, handle_shutdown)

    try:
        while review_worker.is_running:
            time.sleep(1.0)
    except (KeyboardInterrupt, SystemExit):
        review_worker.stop()


if __name__ == "__main__":
    main()

