"""
Cache Layer Configuration for Data Model API

Centralized configuration for cache initialization and setup.
"""

import os
import logging
from typing import Optional

from api.cache import (
    create_cache_layer,
    create_redis_client,
    create_invalidation_manager,
    CacheLayer,
    CacheInvalidationManager,
    RedisClient
)

logger = logging.getLogger(__name__)


class CacheConfig:
    """Cache configuration management"""

    # Cache configuration
    MEMORY_CACHE_MAX_SIZE = int(os.getenv('CACHE_MEMORY_MAX_SIZE', '1000'))
    MEMORY_CACHE_TTL = int(
        os.getenv(
            'CACHE_TTL_MEMORY_SECONDS',
            '120'))  # 2 minutes
    REDIS_CACHE_TTL = int(
        os.getenv(
            'CACHE_TTL_REDIS_SECONDS',
            '1800'))   # 30 minutes

    # Redis configuration
    REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
    REDIS_PORT = int(os.getenv('REDIS_PORT', '6380'))
    REDIS_PASSWORD = os.getenv('REDIS_PASSWORD', '')
    REDIS_ENABLED = os.getenv('REDIS_ENABLED', 'true').lower() == 'true'

    # Cache features
    CACHE_ENABLED = os.getenv('CACHE_ENABLED', 'true').lower() == 'true'
    INVALIDATION_ENABLED = os.getenv(
        'CACHE_INVALIDATION_ENABLED',
        'true').lower() == 'true'

    # Metrics & monitoring
    METRICS_ENABLED = os.getenv(
        'CACHE_METRICS_ENABLED',
        'true').lower() == 'true'


class CacheManager:
    """Centralized cache management"""

    def __init__(self):
        self.cache_layer: Optional[CacheLayer] = None
        self.redis_client: Optional[RedisClient] = None
        self.invalidation_manager: Optional[CacheInvalidationManager] = None
        self._initialized = False

    async def initialize(self, cosmos_store=None) -> bool:
        """Initialize cache layer

        Args:
            cosmos_store: Cosmos DB repository for cache fallthrough

        Returns:
            True if initialization successful
        """
        if self._initialized:
            logger.warning("Cache already initialized")
            return True

        try:
            if not CacheConfig.CACHE_ENABLED:
                logger.info("Cache disabled via config")
                return False

            # Initialize Redis (if enabled)
            if CacheConfig.REDIS_ENABLED:
                try:
                    self.redis_client = create_redis_client(
                        redis_host=CacheConfig.REDIS_HOST,
                        redis_password=CacheConfig.REDIS_PASSWORD,
                        redis_port=CacheConfig.REDIS_PORT
                    )

                    connected = await self.redis_client.connect()
                    if connected:
                        logger.info(
                            f"Redis connected to {CacheConfig.REDIS_HOST}:{CacheConfig.REDIS_PORT}")
                    else:
                        logger.warning(
                            "Redis connection failed, continuing with memory cache only")
                        self.redis_client = None

                except Exception as e:
                    logger.warning(
                        f"Redis initialization failed: {e}, using memory cache only")
                    self.redis_client = None

            # Create cache layer
            self.cache_layer = create_cache_layer(
                redis_client=self.redis_client,
                cosmos_store=cosmos_store,
                ttl_memory_seconds=CacheConfig.MEMORY_CACHE_TTL,
                ttl_redis_seconds=CacheConfig.REDIS_CACHE_TTL
            )

            logger.info("Cache layer initialized")

            # Initialize invalidation manager (if enabled)
            if CacheConfig.INVALIDATION_ENABLED:
                self.invalidation_manager = create_invalidation_manager(
                    cache_layer=self.cache_layer
                )
                logger.info("Cache invalidation manager initialized")

            self._initialized = True
            return True

        except Exception as e:
            logger.error(f"Cache initialization failed: {e}")
            self._initialized = False
            return False

    async def shutdown(self) -> None:
        """Shutdown cache layer"""
        try:
            if self.invalidation_manager:
                await self.invalidation_manager.stop()

            if self.redis_client:
                await self.redis_client.disconnect()

            logger.info("Cache layer shutdown")
        except Exception as e:
            logger.error(f"Cache shutdown error: {e}")

    def is_initialized(self) -> bool:
        """Check if cache is initialized"""
        return self._initialized

    def get_cache_layer(self) -> Optional[CacheLayer]:
        """Get cache layer instance"""
        if not self._initialized:
            logger.warning("Cache not initialized")
            return None
        return self.cache_layer

    def get_invalidation_manager(self) -> Optional[CacheInvalidationManager]:
        """Get invalidation manager instance"""
        if not self._initialized:
            logger.warning("Cache not initialized")
            return None
        return self.invalidation_manager

    def get_redis_client(self) -> Optional[RedisClient]:
        """Get Redis client instance"""
        return self.redis_client

    def stats(self) -> dict:
        """Get cache statistics"""
        stats = {
            'initialized': self._initialized,
            'redis_enabled': CacheConfig.REDIS_ENABLED,
            'redis_connected': bool(
                self.redis_client and self.redis_client.is_connected),
            'invalidation_enabled': CacheConfig.INVALIDATION_ENABLED,
        }

        if self.cache_layer:
            try:
                import asyncio
                cache_stats = asyncio.run(self.cache_layer.stats())
                stats['cache'] = cache_stats
            except Exception as e:
                logger.warning(f"Error getting cache stats: {e}")

        return stats


# Global cache manager instance
_cache_manager: Optional[CacheManager] = None


def get_cache_manager() -> CacheManager:
    """Get global cache manager (singleton)"""
    global _cache_manager
    if _cache_manager is None:
        _cache_manager = CacheManager()
    return _cache_manager


async def initialize_cache(cosmos_store=None) -> bool:
    """Initialize global cache manager

    Args:
        cosmos_store: Cosmos DB repository for cache fallthrough

    Returns:
        True if successful
    """
    manager = get_cache_manager()
    return await manager.initialize(cosmos_store=cosmos_store)


async def shutdown_cache() -> None:
    """Shutdown global cache manager"""
    manager = get_cache_manager()
    await manager.shutdown()


# FastAPI integration helpers
class CacheStartupShutdown:
    """Helper for FastAPI startup/shutdown events"""

    def __init__(self, cosmos_store=None):
        self.cosmos_store = cosmos_store

    async def startup(self):
        """Called on app startup"""
        logger.info("Starting cache initialization...")
        success = await initialize_cache(cosmos_store=self.cosmos_store)
        if success:
            logger.info("Cache initialized successfully")
            manager = get_cache_manager()
            if manager.invalidation_manager:
                # Start invalidation processing loop
                import asyncio
                asyncio.create_task(manager.invalidation_manager.start())
                logger.info("Cache invalidation processor started")
        else:
            logger.warning("Cache initialization failed or disabled")

    async def shutdown(self):
        """Called on app shutdown"""
        logger.info("Shutting down cache...")
        await shutdown_cache()


# Example FastAPI app integration:
"""
from fastapi import FastAPI
from api.cache.config import CacheStartupShutdown, get_cache_manager

app = FastAPI()

# Initialize cache startup/shutdown
cache_events = CacheStartupShutdown(cosmos_store=cosmos_db)

@app.on_event("startup")
async def startup():
    await cache_events.startup()

@app.on_event("shutdown")
async def shutdown():
    await cache_events.shutdown()

# Use in routes
@app.get("/health/cache")
async def cache_health():
    manager = get_cache_manager()
    return manager.stats()
"""


# Middleware for cache metrics (Application Insights)
def create_cache_metrics_middleware(app):
    """Create middleware for cache metrics collection

    Args:
        app: FastAPI app instance

    Returns:
        Middleware function
    """
    from fastapi import Request
    import time
    from typing import Callable

    async def cache_metrics_middleware(request: Request, call_next: Callable):
        """Track cache performance metrics"""
        start_time = time.time()

        # Get cache manager
        manager = get_cache_manager()
        cache_layer = manager.get_cache_layer()

        if cache_layer:
            # Get pre-request stats
            pre_stats = await cache_layer.stats()
            pre_hits = pre_stats['overall']['total_hits']

        # Process request
        response = await call_next(request)

        if cache_layer:
            # Get post-request stats
            post_stats = await cache_layer.stats()
            post_hits = post_stats['overall']['total_hits']

            # Calculate metrics this request
            request_hits = post_hits - pre_hits

            # Log metrics
            duration = (time.time() - start_time) * 1000
            logger.debug(
                f"{request.method} {request.url.path} - "
                f"{duration:.1f}ms - Cache hits: {request_hits}"
            )

            # Add metrics to response headers (for Application Insights)
            response.headers['X-Cache-Hits'] = str(request_hits)
            response.headers['X-Cache-Hit-Rate'] = f"{post_stats['overall']['hit_rate']:.1f}"

        return response

    return cache_metrics_middleware
