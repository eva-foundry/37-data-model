"""
Shared fixtures for the EVA Model API test suite.
Uses TestClient (sync httpx) backed by MemoryStore + MemoryCache.
No external dependencies required.
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from api.server import create_app
from api.store.memory import MemoryStore
from api.cache.memory import MemoryCache
from api.config import Settings


@pytest.fixture(scope="session")
def settings() -> Settings:
    return Settings(
        cosmos_url="",
        cosmos_key="",
        redis_url="",
        admin_token="test-admin",
        default_actor="test-user",
        cache_ttl_seconds=30,
    )


@pytest.fixture
def app(settings):
    """
    Fresh app instance with empty MemoryStore + MemoryCache.
    Auto-seeds from disk JSON on startup.
    """
    _app = create_app()
    # Override settings so tests don't need Cosmos / Redis
    from api import config as _cfg
    _cfg._settings = settings
    return _app


@pytest.fixture
def client(app):
    with TestClient(app) as c:
        yield c


@pytest.fixture
def admin_headers() -> dict[str, str]:
    return {"Authorization": "Bearer test-admin"}
