"""
In-memory store — no external dependencies.
Used automatically when COSMOS_URL is not set.
Data persists for the lifetime of the process only.

Thread-safety: asyncio.Lock per layer — safe for async handlers.
"""
from __future__ import annotations

import asyncio
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

from api.store.base import AbstractStore

_LAYERS = [
    "services",
    "personas",
    "feature_flags",
    "containers",
    "endpoints",
    "schemas",
    "screens",
    "literals",
    "agents",
    "infrastructure",
    "requirements",
]


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class MemoryStore(AbstractStore):
    """
    Dict-backed store.  Structure: {layer: {obj_id: document_dict}}
    """

    def __init__(self) -> None:
        # {layer: {obj_id: dict}}
        self._data: dict[str, dict[str, dict[str, Any]]] = {
            layer: {} for layer in _LAYERS}
        self._lock = asyncio.Lock()

    # ──────────────────────────────────────────────────────────────────────
    # READ
    # ──────────────────────────────────────────────────────────────────────

    async def get_all(self, layer: str,
                      active_only: bool = True) -> list[dict[str, Any]]:
        bucket = self._data.get(layer, {})
        items = list(bucket.values())
        if active_only:
            items = [i for i in items if i.get("is_active", True)]
        return [deepcopy(i) for i in items]

    async def get_one(self, layer: str, obj_id: str) -> dict[str, Any] | None:
        doc = self._data.get(layer, {}).get(obj_id)
        return deepcopy(doc) if doc is not None else None

    # ──────────────────────────────────────────────────────────────────────
    # WRITE
    # ──────────────────────────────────────────────────────────────────────

    async def upsert(
        self, layer: str, obj_id: str, payload: dict[str, Any], actor: str
    ) -> dict[str, Any]:
        async with self._lock:
            if layer not in self._data:
                self._data[layer] = {}

            existing = self._data[layer].get(obj_id)
            now = _now()

            doc: dict[str, Any] = deepcopy(payload)
            doc["obj_id"] = obj_id
            doc["layer"] = layer
            doc["is_active"] = doc.get("is_active", True)
            doc["modified_by"] = actor
            doc["modified_at"] = now

            if existing:
                doc["created_by"] = existing["created_by"]
                doc["created_at"] = existing["created_at"]
                doc["row_version"] = existing["row_version"] + 1
            else:
                doc.setdefault("created_by", actor)
                doc.setdefault("created_at", now)
                doc["row_version"] = 1

            self._data[layer][obj_id] = doc
            return deepcopy(doc)

    async def soft_delete(
        self, layer: str, obj_id: str, actor: str
    ) -> dict[str, Any] | None:
        async with self._lock:
            doc = self._data.get(layer, {}).get(obj_id)
            if doc is None:
                return None
            doc = deepcopy(doc)
            doc["is_active"] = False
            doc["modified_by"] = actor
            doc["modified_at"] = _now()
            doc["row_version"] = doc.get("row_version", 1) + 1
            self._data[layer][obj_id] = doc
            return deepcopy(doc)

    # ──────────────────────────────────────────────────────────────────────
    # AUDIT
    # ──────────────────────────────────────────────────────────────────────

    async def get_audit(self, limit: int = 50) -> list[dict[str, Any]]:
        rows = []
        for layer, bucket in self._data.items():
            for doc in bucket.values():
                rows.append({
                    "layer": layer,
                    "obj_id": doc.get("obj_id"),
                    "modified_by": doc.get("modified_by"),
                    "modified_at": doc.get("modified_at"),
                    "row_version": doc.get("row_version"),
                    "is_active": doc.get("is_active", True),
                })
        rows.sort(key=lambda r: r.get("modified_at") or "", reverse=True)
        return rows[:limit]

    # ──────────────────────────────────────────────────────────────────────
    # BULK LOAD (cold-deploy seed restore — preserves audit fields from JSON)
    # ──────────────────────────────────────────────────────────────────────

    async def bulk_load(
        self, layer: str, objects: list[dict[str, Any]], actor: str
    ) -> int:
        """
        Cold-deploy restore.  Stores objects exactly as exported — preserving
        created_at, created_by, modified_at, modified_by, and row_version
        when they are present in the payload.  Only fills in defaults for
        fields that are genuinely absent (i.e. legacy JSON with no audit trail).

        This differs from upsert():
          upsert()    = live business write  → always re-stamps modified_*, increments row_version
          bulk_load() = cold-start restore   → trusts payload audit fields, never overwrites
        """
        count = 0
        now = _now()
        for obj in objects:
            obj_id = str(obj.get("id", ""))
            if not obj_id:
                continue
            async with self._lock:
                if layer not in self._data:
                    self._data[layer] = {}
                existing = self._data[layer].get(obj_id)
                doc: dict[str, Any] = deepcopy(obj)
                doc["obj_id"] = obj_id
                doc["layer"] = layer
                doc["is_active"] = doc.get("is_active", True)
                # Preserve whatever the JSON already knows; fill gaps with seed
                # defaults
                if "created_by" not in doc:
                    doc["created_by"] = existing["created_by"] if existing else actor
                if "created_at" not in doc:
                    doc["created_at"] = existing["created_at"] if existing else now
                if "modified_by" not in doc:
                    doc["modified_by"] = existing["modified_by"] if existing else actor
                if "modified_at" not in doc:
                    doc["modified_at"] = existing["modified_at"] if existing else now
                if "row_version" not in doc:
                    doc["row_version"] = existing["row_version"] if existing else 1
                self._data[layer][obj_id] = doc
            count += 1
        return count
