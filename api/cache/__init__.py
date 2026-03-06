"""
Cache Module for EVA Data Model API

Multi-tier caching with Redis integration, automated invalidation,
and write-through consistency patterns.

Usage::

    from api.cache import (
        CacheLayer,
        RedisClient,
        CacheInvalidationManager,
        WriteThroughCache,
        create_cache_layer,
        create_redis_client,
        create_invalidation_manager
    )
    
    # Initialize Redis
    redis_client = await create_redis_client("myredis.redis.cache.windows.net")
    await redis_client.connect()
    
    # Initialize cache layer
    cache = create_cache_layer(redis_client=redis_client)
    
    # Initialize invalidation
    invalidation = create_invalidation_manager(cache_layer=cache)
    
    # Start invalidation processing
    asyncio.create_task(invalidation.start())
    
    # Use cache
    value = await cache.get("key")
    await cache.set("key", {"data": "value"})
    
    # Emit invalidation event
    await invalidation.invalidate_on_update("projects", "proj-123")
"""

from .layer import (
    CacheStore,
    MemoryCache,
    RedisCache,
    CacheLayer,
    create_cache_layer
)

from .redis_client import (
    RedisClient,
    create_redis_client
)

from .invalidation import (
    InvalidationEvent,
    CacheInvalidationManager,
    WriteThroughCache,
    create_invalidation_manager
)

from .adapter import (
    LayerRouterCacheAdapter,
    CachedLayerRouter,
    create_cached_routers
)

from .config import (
    CacheConfig,
    CacheManager,
    get_cache_manager,
    initialize_cache,
    shutdown_cache,
    CacheStartupShutdown,
    create_cache_metrics_middleware
)

__all__ = [
    # Cache layer classes
    'CacheStore',
    'MemoryCache',
    'RedisCache',
    'CacheLayer',
    'create_cache_layer',
    
    # Redis client
    'RedisClient',
    'create_redis_client',
    
    # Invalidation
    'InvalidationEvent',
    'CacheInvalidationManager',
    'WriteThroughCache',
    'create_invalidation_manager',
    
    # Adapter/Router caching
    'LayerRouterCacheAdapter',
    'CachedLayerRouter',
    'create_cached_routers',
    
    # Configuration
    'CacheConfig',
    'CacheManager',
    'get_cache_manager',
    'initialize_cache',
    'shutdown_cache',
    'CacheStartupShutdown',
    'create_cache_metrics_middleware',
]

__version__ = '1.0.0'
