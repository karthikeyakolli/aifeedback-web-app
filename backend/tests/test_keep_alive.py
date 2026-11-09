"""Tests for KeepAliveDaemon background service."""

import time
from unittest.mock import patch, MagicMock
from backend.app.services.keep_alive import KeepAliveDaemon


def test_keep_alive_start_and_stop():
    daemon = KeepAliveDaemon(target_url="http://127.0.0.1:8000/api/v1/health", interval_seconds=1)
    
    with patch("urllib.request.urlopen") as mock_urlopen:
        mock_resp = MagicMock()
        mock_resp.status = 200
        mock_urlopen.return_value.__enter__.return_value = mock_resp

        daemon.start()
        assert daemon._thread is not None
        assert daemon._thread.is_alive()

        # Stop daemon cleanly
        daemon.stop()
        assert daemon._thread is None
        assert daemon._stop_event.is_set()


def test_keep_alive_idempotent_start():
    daemon = KeepAliveDaemon(target_url="http://127.0.0.1:8000/api/v1/health", interval_seconds=1)
    daemon.start()
    t1 = daemon._thread
    daemon.start() # Should not spawn a second thread
    assert daemon._thread is t1
    daemon.stop()
