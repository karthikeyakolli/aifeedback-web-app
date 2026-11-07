"""FastAPI Application Entry Point for Product Research Intelligence."""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request, HTTPException
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

    # Phase 2 Durable Background Review Worker & Stale Recovery Daemon
    from backend.app.services.review_worker import review_worker
    if settings.review_worker_enabled:
        review_worker.start()

    yield

    if settings.review_worker_enabled:
        review_worker.stop()
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
    cors_origins = list(settings.cors_origins)
    env_cors = os.getenv("CORS_ORIGINS", "")
    if env_cors:
        cors_origins.extend([origin.strip() for origin in env_cors.split(",") if origin.strip()])

    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_origin_regex=r"https://.*\.pages\.dev",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Request payload size limit middleware (Abuse & DoS protection)
    @app.middleware("http")
    async def validate_request_size_middleware(request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                if int(content_length) > settings.max_request_size_bytes:
                    return JSONResponse(
                        status_code=413,
                        content={
                            "detail": f"Request entity exceeds maximum permitted limit of {settings.max_request_size_bytes} bytes."
                        },
                    )
            except ValueError:
                pass
        return await call_next(request)

    # Explicit HTTPException handler
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
            headers=getattr(exc, "headers", None) or {},
        )

    # Global safe exception handler for uncaught runtime errors
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
