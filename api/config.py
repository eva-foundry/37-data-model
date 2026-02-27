"""
Configuration -- loaded from environment variables.
All settings have defaults so the API works with zero config (in-memory mode).
"""
from __future__ import annotations
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore", populate_by_name=True)

    # --- Cosmos DB (optional — if not set, MemoryStore is used) ---
    cosmos_url: str = ""
    cosmos_key: str = ""
    model_db_name: str = "evamodel"
    model_container_name: str = "model_objects"

    # --- Redis (optional — if not set, MemoryCache is used) ---
    redis_url: str = ""
    # TTL=0 disables caching entirely (best for local dev + agent write-verify cycles).
    # Set to 60+ only for read-heavy dashboards. Agents must use 0 to avoid stale GET after PUT.
    cache_ttl_seconds: int = 0

    # --- API ---
    api_title: str = "EVA Model API"
    api_version: str = "1.0.0"
    admin_token: str = "dev-admin"          # Bearer token for admin endpoints
    default_actor: str = "anonymous"

    # --- Mode ---
    # dev_mode=True (default): allows admin_token='dev-admin' for local development.
    # dev_mode=False (production): startup fails if admin_token is still 'dev-admin'.
    # Set DEV_MODE=false in production .env or container environment.
    dev_mode: bool = True

    # Path to the model directory.
    # Override with MODEL_DIR env var to run an isolated instance pointing at a
    # different model data folder (e.g. a side project with its own layer JSON files).
    model_dir_override: str = Field(default="", validation_alias="MODEL_DIR")

    @property
    def model_dir(self) -> str:
        from pathlib import Path
        if self.model_dir_override:
            return str(Path(self.model_dir_override))
        return str(Path(__file__).parents[1] / "model")

    @property
    def use_cosmos(self) -> bool:
        return bool(self.cosmos_url and self.cosmos_key)

    @property
    def use_redis(self) -> bool:
        return bool(self.redis_url)


_settings: Settings | None = None


def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
