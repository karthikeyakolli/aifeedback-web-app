"""Application configuration settings for Product Research Intelligence API."""

from __future__ import annotations

import os
from typing import List
from pydantic import BaseModel, Field


class Settings(BaseModel):
    """Application settings with environment variable defaults."""

    app_name: str = "Product Research Intelligence API"
    app_version: str = "0.1.0"
    environment: str = os.getenv("ENVIRONMENT", "development")
    api_v1_prefix: str = "/api/v1"
    host: str = os.getenv("HOST", "127.0.0.1")
    port: int = int(os.getenv("PORT", "8000"))

    # CORS configuration
    cors_origins: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Database
    database_url: str = os.getenv(
        "DATABASE_URL", "sqlite:///./data/product_intelligence.db"
    )
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_anon_key: str = os.getenv("SUPABASE_ANON_KEY", "")
    supabase_service_role_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    # AI Configuration (Phase 3+)
    ai_provider: str = os.getenv("AI_PROVIDER", "gemini")
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    ai_timeout_seconds: int = int(os.getenv("AI_REQUEST_TIMEOUT_SECONDS", "25"))


settings = Settings()
