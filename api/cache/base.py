"""Abstract cache interface."""
from __future__ import annotations
from abc import ABC, abstractmethod
from typing import Any


class AbstractCache(ABC):

    @abstractmethod
    async def get_layer(self, layer: str) -> list[dict] | None: ...

    @abstractmethod
    async def set_layer(self, layer: str, data: list[dict], ttl: int) -> None: ...

    @abstractmethod
    async def get_obj(self, layer: str, obj_id: str) -> dict | None: ...

    @abstractmethod
    async def set_obj(self, layer: str, obj_id: str, data: dict, ttl: int) -> None: ...

    @abstractmethod
    async def invalidate_layer(self, layer: str) -> None: ...

    @abstractmethod
    async def invalidate_obj(self, layer: str, obj_id: str) -> None: ...

    @abstractmethod
    async def flush_all(self) -> None: ...
