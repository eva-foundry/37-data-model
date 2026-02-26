"""
FastAPI dependency injectors.
Store and cache are attached to app.state during lifespan startup.
"""
from __future__ import annotations

from fastapi import Depends, Header, HTTPException, Request, status

from api.config import Settings, get_settings
from api.store.base import AbstractStore
from api.cache.base import AbstractCache


def get_store(request: Request) -> AbstractStore:
    return request.app.state.store


def get_cache(request: Request) -> AbstractCache:
    return request.app.state.cache


def get_actor(
    x_actor: str = Header(default=""),
    settings: Settings = Depends(get_settings),
) -> str:
    """Extract actor id from X-Actor header. Falls back to settings default."""
    return x_actor.strip() or settings.default_actor


def require_admin(
    authorization: str = Header(default=""),
    settings: Settings = Depends(get_settings),
) -> str:
    """
    Simple token gate for admin endpoints.
    Accepts:  Authorization: Bearer <admin_token>
    In production, replace with real RBAC / Entra validation.
    """
    token = authorization.removeprefix("Bearer ").strip()
    if not token or token != settings.admin_token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required. Supply: Authorization: Bearer <admin_token>",
        )
    # Return the token as the actor id for audit trail
    return f"admin:{token[:8]}"
