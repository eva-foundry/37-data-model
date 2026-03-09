"""
ModelObject — base class for every EVA model object.

Audit fields (server-stamped, never sent by clients):
  id           — business key, matches URL {id} segment
  created_by   — actor on first write
  created_at   — timestamp of first write
  modified_by  — actor on last write
  modified_at  — timestamp of last write
  row_version  — monotonically increasing write counter (+1 per upsert)
  is_active    — false = soft-deleted (GET one returns 404, list skips)
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel, Field


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ModelObject(BaseModel):
    """
    Every object stored in the EVA model store must be a dict that
    satisfies these audit fields.  The API stamps them automatically —
    callers never need to supply them.
    """

    # ── identity ──────────────────────────────────────────────────────────
    obj_id: str = Field(...,
                        description="Original business key, e.g. 'GET /v1/translations'")
    layer: str = Field(
        ...,
        description="Layer this object belongs to",
        examples=["services", "endpoints", "containers", "screens"],
    )

    # ── audit ─────────────────────────────────────────────────────────────
    created_by: str = Field(default="system",
                            description="Actor id that created this record")
    created_at: datetime = Field(
        default_factory=_utcnow, description="UTC creation timestamp"
    )
    modified_by: str = Field(
        default="system",
        description="Actor id of last writer")
    modified_at: datetime = Field(
        default_factory=_utcnow, description="UTC last-write timestamp"
    )
    row_version: int = Field(
        default=1,
        ge=1,
        description="Sequential write counter — starts at 1, +1 on every write. "
                    "Read it back; if it changed between your GET and PUT, "
                    "someone else wrote in between (optimistic concurrency signal).",
    )

    # ── soft-delete ───────────────────────────────────────────────────────
    is_active: bool = Field(
        default=True,
        description="False = soft-deleted. Excluded from list queries by default.",
    )

    # ── business payload ──────────────────────────────────────────────────
    # All additional fields from the layer JSON files are stored here.
    data: dict[str, Any] = Field(
        default_factory=dict,
        description="Full business payload from the layer JSON file",
    )

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}

    def to_response(self) -> dict[str, Any]:
        """Return a dict merging audit fields + business data for API responses."""
        result: dict[str, Any] = {
            "id": self.obj_id,
            "layer": self.layer,
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat(),
            "modified_by": self.modified_by,
            "modified_at": self.modified_at.isoformat(),
            "row_version": self.row_version,
            "is_active": self.is_active,
        }
        result.update(self.data)
        return result
