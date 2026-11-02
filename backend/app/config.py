"""Application configuration settings for Product Research Intelligence API."""

from __future__ import annotations

import os
from pathlib import Path
from typing import List
from pydantic import BaseModel, Field

try:
    from dotenv import load_dotenv
    # Search root .env relative to this file or current working directory
    env_path = Path(__file__).resolve().parent.parent.parent / ".env"
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)
    else:
        load_dotenv()
except ImportError:
    pass


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

    # Authentication Configuration
    # Options: "auto", "supabase", "local"
    # In production (ENVIRONMENT=production), "local" auth is prohibited.
    auth_provider: str = os.getenv("AUTH_PROVIDER", "auto")
    supabase_jwt_secret: str = os.getenv("SUPABASE_JWT_SECRET", "")
    supabase_jwt_algorithm: str = os.getenv("SUPABASE_JWT_ALGORITHM", "HS256")
    local_jwt_secret: str = os.getenv("JWT_SECRET_KEY", "pri-insecure-dev-secret-key-change-in-prod-983172")

    # Security & Request Limits
    max_request_size_bytes: int = int(os.getenv("MAX_REQUEST_SIZE_BYTES", str(2 * 1024 * 1024)))  # 2MB default

    # AI Configuration (Phase 3 & 4 Engine, Phase 5 Reviews)
    ai_provider: str = os.getenv("AI_PROVIDER", "auto")
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
    groq_api_key: str = os.getenv("GROQ_API_KEY", "")
    groq_model: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")

    # OpenRouter Configuration (Strict Free Tier)
    openrouter_api_key: str = os.getenv("OPENROUTER_API_KEY", "")
    openrouter_model: str = os.getenv("OPENROUTER_MODEL", "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free")
    openrouter_free_only: bool = os.getenv("OPENROUTER_FREE_ONLY", "true").lower() in ("true", "1", "yes")
    openrouter_site_url: str = os.getenv("OPENROUTER_SITE_URL", "http://localhost:5173")
    openrouter_site_name: str = os.getenv("OPENROUTER_SITE_NAME", "AI Project Feedback Platform")

    # NVIDIA NIM Configuration
    nvidia_api_key: str = os.getenv("NVIDIA_API_KEY", "")
    nvidia_model: str = os.getenv("NVIDIA_MODEL", "nvidia/llama-3.1-nemotron-70b-instruct")
    nvidia_base_url: str = os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1")

    ai_timeout_seconds: int = int(os.getenv("AI_REQUEST_TIMEOUT_SECONDS", "30"))
    ai_max_retries: int = int(os.getenv("AI_MAX_RETRIES", "2"))
    ai_max_output_tokens: int = int(os.getenv("GEMINI_MAX_OUTPUT_TOKENS", "4096"))
    max_analysis_comments: int = int(os.getenv("MAX_ANALYSIS_COMMENTS", "100"))
    ai_cooldown_seconds: int = int(os.getenv("AI_COOLDOWN_SECONDS", "30"))


settings = Settings()


