"""Unit tests for FastAPI Health endpoints and middleware configuration."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.config import settings

client = TestClient(app)


def test_root_health_endpoint() -> None:
    """Verifies that GET /api/health responds with 200 OK and expected structure."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["version"] == settings.app_version
    assert data["environment"] == settings.environment
    assert "timestamp" in data


def test_api_v1_health_endpoint() -> None:
    """Verifies that GET /api/v1/health responds with 200 OK and services map."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "services" in data
    assert data["services"]["api"] == "operational"


def test_cors_headers_configured() -> None:
    """Verifies that CORS origins are accepted and headers returned."""
    headers = {
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "GET",
    }
    response = client.options("/api/health", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_nonexistent_route_returns_404() -> None:
    """Verifies that querying an undefined path returns standard 404."""
    response = client.get("/api/v1/nonexistent-endpoint-abc")
    assert response.status_code == 404


def test_post_insights_returns_expected_phase1_status() -> None:
    """Verifies that post insights endpoint in Phase 1 indicates activation in Phase 3."""
    response = client.get("/api/v1/ai/post-123/insights")
    assert response.status_code == 404
    data = response.json()
    assert "Phase 3" in data["detail"]
