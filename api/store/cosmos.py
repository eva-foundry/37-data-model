"""
Cosmos DB store — used when COSMOS_URL + COSMOS_KEY are set.

Cosmos document layout
  id           = base64url(layer + "::" + obj_id)   — avoids banned chars (/ ? # \\)
  obj_id       = original business key
  layer        = partition key value
  + all audit fields
  + all business payload fields (flat merge)

Composite indexes provisioned on container creation:
  [layer ASC, obj_id ASC]
  [layer ASC, is_active ASC]
  [layer ASC, modified_at DESC]
"""
from __future__ import annotations

import asyncio
import base64
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

from azure.cosmos.aio import CosmosClient
from azure.cosmos import PartitionKey, exceptions

from api.store.base import AbstractStore


def _cosmos_id(layer: str, obj_id: str) -> str:
    """Encode (layer, obj_id) into a Cosmos-safe document id."""
    raw = f"{layer}::{obj_id}".encode()
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


_INDEXING_POLICY = {
    "indexingMode": "consistent",
    "includedPaths": [{"path": "/*"}],
    "excludedPaths": [{"path": '/"_etag"/?'}],
    "compositeIndexes": [
        [
            {"path": "/layer", "order": "ascending"},
            {"path": "/obj_id", "order": "ascending"},
        ],
        [
            {"path": "/layer", "order": "ascending"},
            {"path": "/is_active", "order": "ascending"},
        ],
        [
            {"path": "/layer", "order": "ascending"},
            {"path": "/modified_at", "order": "descending"},
        ],
    ],
}


class CosmosStore(AbstractStore):

    def __init__(
            self,
            url: str,
            key: str,
            db_name: str,
            container_name: str) -> None:
        self._url = url
        self._key = key
        self._db_name = db_name
        self._container_name = container_name
        self._client: CosmosClient | None = None
        self._container = None

    async def init(self) -> None:
        self._client = CosmosClient(self._url, credential=self._key)
        db = await self._client.create_database_if_not_exists(self._db_name)
        self._container = await db.create_container_if_not_exists(
            id=self._container_name,
            partition_key=PartitionKey(path="/layer"),
            indexing_policy=_INDEXING_POLICY,
        )

    # ──────────────────────────────────────────────────────────────────────
    # READ
    # ──────────────────────────────────────────────────────────────────────

    async def get_all(self, layer: str,
                      active_only: bool = True) -> list[dict[str, Any]]:
        query = "SELECT * FROM c WHERE c.layer = @layer"
        params: list[dict] = [{"name": "@layer", "value": layer}]
        if active_only:
            query += " AND c.is_active = true"
        results = []
        async for item in self._container.query_items(query=query, parameters=params):
            results.append(_strip(item))
        return results

    async def get_one(self, layer: str, obj_id: str) -> dict[str, Any] | None:
        doc_id = _cosmos_id(layer, obj_id)
        try:
            item = await self._container.read_item(item=doc_id, partition_key=layer)
            return _strip(item)
        except exceptions.CosmosResourceNotFoundError:
            return None

    # ──────────────────────────────────────────────────────────────────────
    # WRITE
    # ──────────────────────────────────────────────────────────────────────

    async def upsert(
        self, layer: str, obj_id: str, payload: dict[str, Any], actor: str
    ) -> dict[str, Any]:
        doc_id = _cosmos_id(layer, obj_id)
        existing = await self.get_one(layer, obj_id)
        now = _now()

        doc: dict[str, Any] = deepcopy(payload)
        # Cosmos document id
        doc["id"] = doc_id
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

        stored = await self._container.upsert_item(body=doc)
        return _strip(stored)

    async def bulk_load(
        self, layer: str, objects: list[dict[str, Any]], actor: str,
        concurrency: int = 50,
    ) -> int:
        """
        Cold-deploy restore — mirrors MemoryStore.bulk_load semantics.
        Preserves audit fields from payload; fills defaults only for absent fields.

        PROD-WI-4: Parallelized with asyncio.gather behind a Semaphore(concurrency).
        Sequential cost was O(N*2) Cosmos round-trips (get_one + upsert per object).
        New cost: 1 get_all query + O(N/concurrency) parallel upsert batches.
        For 960 objects at concurrency=50: ~1 read + ~20 parallel batches vs 1920 serial calls.
        """
        now = _now()

        # Step 1: bulk-fetch existing objects in ONE query to build a lookup map.
        # active_only=False ensures we capture soft-deleted objects too.
        existing_list = await self.get_all(layer, active_only=False)
        existing_map: dict[str, dict[str, Any]] = {
            str(e.get("id", "")): e for e in existing_list
        }

        # Step 2: build all Cosmos documents (pure Python, no I/O).
        docs: list[dict[str, Any]] = []
        for obj in objects:
            obj_id = str(obj.get("id", ""))
            if not obj_id:
                continue
            ex = existing_map.get(obj_id)
            doc: dict[str, Any] = deepcopy(obj)
            doc["id"] = _cosmos_id(layer, obj_id)
            doc["obj_id"] = obj_id
            doc["layer"] = layer
            doc["is_active"] = doc.get("is_active", True)
            # Preserve whatever the JSON already knows; fill gaps only.
            if "created_by" not in doc:
                doc["created_by"] = ex["created_by"] if ex else actor
            if "created_at" not in doc:
                doc["created_at"] = ex["created_at"] if ex else now
            if "modified_by" not in doc:
                doc["modified_by"] = ex["modified_by"] if ex else actor
            if "modified_at" not in doc:
                doc["modified_at"] = ex["modified_at"] if ex else now
            if "row_version" not in doc:
                doc["row_version"] = ex["row_version"] if ex else 1
            docs.append(doc)

        # Step 3: parallel upserts behind a semaphore to avoid RU burst limits.
        sem = asyncio.Semaphore(concurrency)

        async def _upsert(d: dict[str, Any]) -> None:
            async with sem:
                await self._container.upsert_item(body=d)

        await asyncio.gather(*[_upsert(d) for d in docs])
        return len(docs)

    async def soft_delete(
        self, layer: str, obj_id: str, actor: str
    ) -> dict[str, Any] | None:
        existing = await self.get_one(layer, obj_id)
        if existing is None:
            return None
        doc = deepcopy(existing)
        doc["is_active"] = False
        doc["modified_by"] = actor
        doc["modified_at"] = _now()
        doc["row_version"] = doc.get("row_version", 1) + 1
        # restore Cosmos id
        doc["id"] = _cosmos_id(layer, obj_id)
        stored = await self._container.upsert_item(body=doc)
        return _strip(stored)

    # ──────────────────────────────────────────────────────────────────────
    # AUDIT
    # ──────────────────────────────────────────────────────────────────────

    async def get_audit(self, limit: int = 50) -> list[dict[str, Any]]:
        query = (
            "SELECT c.layer, c.obj_id, c.modified_by, c.modified_at, c.row_version, c.is_active "
            "FROM c ORDER BY c.modified_at DESC OFFSET 0 LIMIT @limit")
        params = [{"name": "@limit", "value": limit}]
        rows = []
        async for item in self._container.query_items(
            query=query, parameters=params, enable_cross_partition_query=True
        ):
            rows.append(item)
        return rows


# ── helpers ───────────────────────────────────────────────────────────────

_COSMOS_KEYS = {"_rid", "_self", "_etag", "_attachments", "_ts"}


def _strip(doc: dict) -> dict:
    """Remove Cosmos internal fields and the encoded id — return obj_id as 'id'."""
    result = {k: v for k, v in doc.items() if k not in _COSMOS_KEYS}
    # Replace encoded Cosmos id with the business obj_id
    if "obj_id" in result:
        result["id"] = result.pop("obj_id")
    elif "id" in result:
        pass  # already sane
    return result
