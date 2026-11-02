"""Pydantic schemas for Creator Space."""

from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, Field
from backend.app.schemas.project import PublicProjectRead


class CreatorProfileUpdate(BaseModel):
    displayName: Optional[str] = Field(None, min_length=2, max_length=50)
    bio: Optional[str] = Field(None, max_length=500)
    avatarUrl: Optional[str] = None
    githubUrl: Optional[str] = None
    websiteUrl: Optional[str] = None
    skills: Optional[List[str]] = Field(default_factory=list)


class CreatorProfileRead(BaseModel):
    id: str
    username: str
    displayName: str
    bio: Optional[str] = None
    avatarUrl: Optional[str] = None
    githubUrl: Optional[str] = None
    websiteUrl: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    reputationScore: int = 0
    joinedAt: str


class LaunchReadiness(BaseModel):
    hasAiReview: bool
    hasRepoUrl: bool
    hasDemoUrl: bool
    openBlockersCount: int
    isLaunchReady: bool


class CreatorShowcaseProject(BaseModel):
    id: str
    name: str
    tagline: str
    description: str
    category: str
    status: str
    isPublic: bool
    repositoryUrl: Optional[str] = None
    demoUrl: Optional[str] = None
    upvotesCount: int
    reviewsCount: int
    readiness: LaunchReadiness
    createdAt: str
    updatedAt: str


class CreatorStudioMetrics(BaseModel):
    totalProjectsCount: int
    publishedProjectsCount: int
    privateProjectsCount: int
    totalUpvotesReceived: int
    totalReviewsCompleted: int
    totalOpenBlockers: int


class CreatorStudioOverview(BaseModel):
    profile: CreatorProfileRead
    metrics: CreatorStudioMetrics
    projects: List[CreatorShowcaseProject]


class PublicCreatorProfile(BaseModel):
    username: str
    displayName: str
    bio: Optional[str] = None
    avatarUrl: Optional[str] = None
    githubUrl: Optional[str] = None
    websiteUrl: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    reputationScore: int = 0
    joinedAt: str
    totalPublishedProjects: int
    totalUpvotesReceived: int
    publishedProjects: List[PublicProjectRead] = Field(default_factory=list)

