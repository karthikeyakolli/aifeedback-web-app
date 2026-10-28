"""Main API v1 router aggregator."""

from __future__ import annotations

from fastapi import APIRouter
from backend.app.api.v1.health import router as health_router
from backend.app.api.v1.posts import router as posts_router
from backend.app.api.v1.comments import router as comments_router
from backend.app.api.v1.ai import router as ai_router

api_v1_router = APIRouter()

api_v1_router.include_router(health_router)
api_v1_router.include_router(posts_router)
api_v1_router.include_router(comments_router)
api_v1_router.include_router(ai_router)
