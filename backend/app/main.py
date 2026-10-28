"""FastAPI Application Entry Point for Product Research Intelligence."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.config import settings
from backend.app.api.v1.router import api_v1_router
from backend.app.schemas.health import HealthResponse

# Logging configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("product_intelligence")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager for clean startup and shutdown."""
    logger.info("Initializing Product Research Intelligence API (Phase 1 Shell)...")
    logger.info(f"Environment: {settings.environment} | Version: {settings.app_version}")
    yield
    logger.info("Shutting down Product Research Intelligence API.")


def create_application() -> FastAPI:
    """Factory creating and configuring the FastAPI instance."""
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="API for Product Research Intelligence — Anonymous Feedback Community with AI",
        lifespan=lifespan,
    )

    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Global safe exception handler
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.error(f"Unhandled exception on {request.method} {request.url.path}: {str(exc)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "error": "InternalServerError",
                "message": "An unexpected error occurred. Request logged safely.",
                "path": request.url.path,
            },
        )

    # Root health endpoint
    @app.get("/api/health", response_model=HealthResponse, tags=["Health"])
    async def root_health() -> HealthResponse:
        return HealthResponse(
            status="healthy",
            version=settings.app_version,
            environment=settings.environment,
        )

    # Mount API v1 router
    app.include_router(api_v1_router, prefix=settings.api_v1_prefix)

    return app


app = create_application()
