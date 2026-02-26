"""
Redis-backed cache — used when REDIS_URL is set.
Falls back gracefully: if Redis is unavailable, cache misses are treated as misses
(never raises, just bypasses).
"""
from __future__ import annotations

import json
import logging
from typing import Any

from api.cache.base import AbstractCache

log = logging.getLogger(__name__)


class RedisCache(AbstractCache):

    def __init__(self, redis_url: str, ttl: int = 60) -> None:
        self._url = redis_url
        self._default_ttl = ttl
        self._redis = None

    async def init(self) -> None:
        import redis.asyncio as aioredis
        self._redis = aioredis.from_url(self._url, decode_responses=True)

    # ── helpers ───────────────────────────────────────────────────────────

    @staticmethod
    def _lk(layer: str) -> str:
        return f"eva:layer:{layer}"

    @staticmethod
    def _ok(layer: str, obj_id: str) -> str:
        return f"eva:obj:{layer}:{obj_id}"

    async def _get(self, key: str) -> Any | None:
        if not self._redis:
            return None
        try:
            raw = await self._redis.get(key)
            return json.loads(raw) if raw else None
        except Exception as exc:
            log.warning("Redis get failed: %s", exc)
            return None

    async def _set(self, key: str, data: Any, ttl: int) -> None:
        if not self._redis:
            return
        try:
            await self._redis.setex(key, ttl, json.dumps(data, default=str))
        except Exception as exc:
            log.warning("Redis set failed: %s", exc)

    async def _del(self, *keys: str) -> None:
        if not self._redis:
            return
        try:
            await self._redis.delete(*keys)
        except Exception as exc:
            log.warning("Redis del failed: %s", exc)

    # ── layer ─────────────────────────────────────────────────────────────

    async def get_layer(self, layer: str) -> list[dict] | None:
        return await self._get(self._lk(layer))

    async def set_layer(self, layer: str, data: list[dict], ttl: int) -> None:
        await self._set(self._lk(layer), data, ttl)

    # ── object ────────────────────────────────────────────────────────────

    async def get_obj(self, layer: str, obj_id: str) -> dict | None:
        return await self._get(self._ok(layer, obj_id))

    async def set_obj(self, layer: str, obj_id: str, data: dict, ttl: int) -> None:
        await self._set(self._ok(layer, obj_id), data, ttl)

    # ── invalidation ──────────────────────────────────────────────────────

    async def invalidate_layer(self, layer: str) -> None:
        await self._del(self._lk(layer))

    async def invalidate_obj(self, layer: str, obj_id: str) -> None:
        await self._del(self._ok(layer, obj_id))

    async def flush_all(self) -> None:
        if not self._redis:
            return
        try:
            await self._redis.flushdb()
        except Exception as exc:
            log.warning("Redis flush failed: %s", exc)
