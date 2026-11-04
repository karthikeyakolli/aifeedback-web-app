"""Main API v1 router aggregator."""

from __future__ import annotations

from fastapi import APIRouter
from backend.app.api.v1.health import router as health_router
from backend.app.api.v1.auth import router as auth_router
from backend.app.api.v1.posts import router as posts_router
from backend.app.api.v1.comments import router as comments_router
from backend.app.api.v1.reports import router as reports_router
from backend.app.api.v1.notifications import router as notifications_router
from backend.app.api.v1.users import router as users_router
from backend.app.api.v1.ai import router as ai_router
from backend.app.api.v1.dev import router as dev_router
from backend.app.api.v1.projects import router as feedback_projects_router
from backend.app.api.v1.creator import router as creator_router
from backend.app.api.v1.credentials import router as credentials_router

api_v1_router = APIRouter()

api_v1_router.include_router(health_router)
api_v1_router.include_router(auth_router)
api_v1_router.include_router(credentials_router)
api_v1_router.include_router(feedback_projects_router)
api_v1_router.include_router(creator_router)
api_v1_router.include_router(posts_router)
api_v1_router.include_router(comments_router)
api_v1_router.include_router(reports_router)
api_v1_router.include_router(notifications_router)
api_v1_router.include_router(users_router)
api_v1_router.include_router(ai_router)
api_v1_router.include_router(dev_router)
