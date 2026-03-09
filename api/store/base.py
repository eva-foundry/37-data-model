"""Abstract store interface — both MemoryStore and CosmosStore implement this."""
from __future__ import annotations
from abc import ABC, abstractmethod
from typing import Any


class AbstractStore(ABC):

    @abstractmethod
    async def get_all(self, layer: str,
                      active_only: bool = True) -> list[dict[str, Any]]:
        """Return all objects for a layer, optionally filtering out inactive ones."""

    @abstractmethod
    async def get_one(self, layer: str, obj_id: str) -> dict[str, Any] | None:
        """Return a single object by (layer, obj_id), or None if not found."""

    @abstractmethod
    async def upsert(self, layer: str, obj_id: str,
                     payload: dict[str, Any], actor: str) -> dict[str, Any]:
        """
        Create or update an object (live business write).
        - On create: stamps created_by, created_at, row_version=1
        - On update: preserves created_*, increments row_version, stamps modified_*
        Returns the stored document.
        """

    @abstractmethod
    async def bulk_load(
        self, layer: str, objects: list[dict[str, Any]], actor: str
    ) -> int:
        """
        Cold-deploy seed restore.  Preserves every audit field that exists in the
        payload (created_at, created_by, modified_at, modified_by, row_version).
        Only fills in defaults for fields that are genuinely absent.
        This is NOT a business write — row_version is NOT incremented if already set.
        """

    @abstractmethod
    async def soft_delete(self, layer: str, obj_id: str,
                          actor: str) -> dict[str, Any] | None:
        """Set is_active=False, increment row_version. Returns updated doc or None."""

    @abstractmethod
    async def get_audit(self, limit: int = 50) -> list[dict[str, Any]]:
        """Return the last `limit` write events sorted by modified_at DESC."""
