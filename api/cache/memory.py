"""
In-memory TTL cache — no Redis required.
Used automatically when REDIS_URL is not set.
"""
from __future__ import annotations

import time
from copy import deepcopy
from typing import Any

from api.cache.base import AbstractCache


class _Entry:
    __slots__ = ("data", "expires_at")

    def __init__(self, data: Any, ttl: int) -> None:
        self.data = data
        self.expires_at = time.monotonic() + ttl if ttl > 0 else float("inf")

    def is_valid(self) -> bool:
        return time.monotonic() < self.expires_at


class MemoryCache(AbstractCache):

    def __init__(self) -> None:
        self._layers: dict[str, _Entry] = {}
        self._objs: dict[str, _Entry] = {}   # key: "layer::obj_id"

    # ── layer ─────────────────────────────────────────────────────────────

    async def get_layer(self, layer: str) -> list[dict] | None:
        entry = self._layers.get(layer)
        if entry and entry.is_valid():
            return deepcopy(entry.data)
        return None

    async def set_layer(self, layer: str, data: list[dict], ttl: int) -> None:
        if ttl == 0:
            return  # TTL=0 means no-cache -- never store, reads always go to store
        self._layers[layer] = _Entry(deepcopy(data), ttl)

    # ── object ────────────────────────────────────────────────────────────

    async def get_obj(self, layer: str, obj_id: str) -> dict | None:
        key = f"{layer}::{obj_id}"
        entry = self._objs.get(key)
        if entry and entry.is_valid():
            return deepcopy(entry.data)
        return None

    async def set_obj(
            self,
            layer: str,
            obj_id: str,
            data: dict,
            ttl: int) -> None:
        if ttl == 0:
            return  # TTL=0 means no-cache -- never store, reads always go to store
        self._objs[f"{layer}::{obj_id}"] = _Entry(deepcopy(data), ttl)

    # ── invalidation ──────────────────────────────────────────────────────

    async def invalidate_layer(self, layer: str) -> None:
        self._layers.pop(layer, None)
        # Also evict per-object entries for this layer so stale data is never
        # served
        prefix = f"{layer}::"
        stale = [k for k in self._objs if k.startswith(prefix)]
        for k in stale:
            del self._objs[k]

    async def invalidate_obj(self, layer: str, obj_id: str) -> None:
        self._objs.pop(f"{layer}::{obj_id}", None)

    async def flush_all(self) -> None:
        self._layers.clear()
        self._objs.clear()
