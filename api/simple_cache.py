"""
Cache Abstraction Layer for EVA Data Model API

Provides Redis-backed caching with graceful fallback to in-memory dict.
Supports cache invalidation patterns for write operations.

Usage:
    from api.simple_cache import cache_client
    
    # Get from cache
    data = await cache_client.get("agent-summary:v1")
    if data is None:
        data = await fetch_from_cosmos()
        await cache_client.set("agent-summary:v1", data)
    
    # Invalidate on write
    await cache_client.delete("agent-summary:v1")
    await cache_client.delete_pattern("wbs:*")
"""

import json
import logging
from typing import Optional, Any, Dict
import os

# Try importing Redis, fall back gracefully
try:
    import redis.asyncio as redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    redis = None

logger = logging.getLogger(__name__)


class CacheClient:
    """
    Cache client with Redis backend and in-memory fallback.
    
    Provides automatic JSON serialization/deserialization and pattern-based invalidation.
    """
    
    def __init__(self):
        self.redis_client: Optional[Any] = None
        self.memory_cache: Dict[str, str] = {}
        self.enabled = os.getenv("CACHE_ENABLED", "true").lower() == "true"
        self.mode = "disabled"
        
        # Metrics
        self.hits = 0
        self.misses = 0
        self.invalidations = 0
        
        if not self.enabled:
            logger.info("Cache disabled via CACHE_ENABLED environment variable")
            return
        
        # Try to connect to Redis
        redis_host = os.getenv("REDIS_HOST")
        redis_port = int(os.getenv("REDIS_PORT", "6379"))
        redis_password = os.getenv("REDIS_PASSWORD")
        
        if redis_host and REDIS_AVAILABLE:
            try:
                self.redis_client = redis.Redis(
                    host=redis_host,
                    port=redis_port,
                    password=redis_password,
                    decode_responses=True,
                    socket_connect_timeout=2,
                    socket_timeout=2
                )
                self.mode = "redis"
                logger.info(f"Cache initialized in Redis mode: {redis_host}:{redis_port}")
            except Exception as e:
                logger.warning(f"Redis connection failed: {e}. Falling back to memory cache.")
                self.redis_client = None
                self.mode = "memory"
        else:
            self.mode = "memory"
            if not redis_host:
                logger.info("No REDIS_HOST configured, using in-memory cache")
            elif not REDIS_AVAILABLE:
                logger.warning("redis package not installed, using in-memory cache. Install: pip install redis")
    
    async def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache.
        
        Returns None if key not found or cache is disabled.
        Automatically deserializes JSON.
        """
        if not self.enabled:
            return None
        
        try:
            if self.mode == "redis" and self.redis_client:
                value = await self.redis_client.get(key)
                if value:
                    self.hits += 1
                    logger.debug(f"Cache HIT: {key}")
                    return json.loads(value)
                else:
                    self.misses += 1
                    logger.debug(f"Cache MISS: {key}")
                    return None
            elif self.mode == "memory":
                value = self.memory_cache.get(key)
                if value:
                    self.hits += 1
                    logger.debug(f"Cache HIT (memory): {key}")
                    return json.loads(value)
                else:
                    self.misses += 1
                    logger.debug(f"Cache MISS (memory): {key}")
                    return None
        except Exception as e:
            logger.error(f"Cache GET error for key {key}: {e}")
            self.misses += 1
            return None
        
        return None
    
    async def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None
    ) -> bool:
        """
        Set value in cache with optional TTL (seconds).
        
        Automatically serializes value to JSON.
        Returns True if successful, False otherwise.
        """
        if not self.enabled:
            return False
        
        try:
            json_value = json.dumps(value, default=str)
            
            if self.mode == "redis" and self.redis_client:
                if ttl:
                    await self.redis_client.setex(key, ttl, json_value)
                else:
                    await self.redis_client.set(key, json_value)
                logger.debug(f"Cache SET: {key} (TTL: {ttl}s)" if ttl else f"Cache SET: {key}")
                return True
            elif self.mode == "memory":
                self.memory_cache[key] = json_value
                logger.debug(f"Cache SET (memory): {key}")
                # Note: TTL not supported in memory mode
                return True
        except Exception as e:
            logger.error(f"Cache SET error for key {key}: {e}")
            return False
        
        return False
    
    async def delete(self, key: str) -> bool:
        """
        Delete a specific key from cache.
        
        Returns True if successful or key didn't exist, False on error.
        """
        if not self.enabled:
            return False
        
        try:
            if self.mode == "redis" and self.redis_client:
                await self.redis_client.delete(key)
                self.invalidations += 1
                logger.debug(f"Cache DELETE: {key}")
                return True
            elif self.mode == "memory":
                self.memory_cache.pop(key, None)
                self.invalidations += 1
                logger.debug(f"Cache DELETE (memory): {key}")
                return True
        except Exception as e:
            logger.error(f"Cache DELETE error for key {key}: {e}")
            return False
        
        return False
    
    async def delete_pattern(self, pattern: str) -> int:
        """
        Delete all keys matching a pattern (e.g., "wbs:*").
        
        Returns count of deleted keys, or 0 on error.
        """
        if not self.enabled:
            return 0
        
        try:
            if self.mode == "redis" and self.redis_client:
                # Use SCAN to find matching keys
                cursor = 0
                deleted_count = 0
                while True:
                    cursor, keys = await self.redis_client.scan(cursor, match=pattern, count=100)
                    if keys:
                        await self.redis_client.delete(*keys)
                        deleted_count += len(keys)
                    if cursor == 0:
                        break
                
                self.invalidations += deleted_count
                logger.info(f"Cache DELETE PATTERN: {pattern} (deleted {deleted_count} keys)")
                return deleted_count
            elif self.mode == "memory":
                # Simple pattern matching for memory cache
                import fnmatch
                keys_to_delete = [k for k in self.memory_cache.keys() if fnmatch.fnmatch(k, pattern)]
                for key in keys_to_delete:
                    del self.memory_cache[key]
                
                self.invalidations += len(keys_to_delete)
                logger.info(f"Cache DELETE PATTERN (memory): {pattern} (deleted {len(keys_to_delete)} keys)")
                return len(keys_to_delete)
        except Exception as e:
            logger.error(f"Cache DELETE PATTERN error for {pattern}: {e}")
            return 0
        
        return 0
    
    async def clear_all(self) -> bool:
        """
        Clear ALL cache entries.
        
        Use with caution! Only for testing or emergency invalidation.
        """
        if not self.enabled:
            return False
        
        try:
            if self.mode == "redis" and self.redis_client:
                # Only clear keys in our namespace (avoid affecting other apps)
                count = await self.delete_pattern("*")
                logger.warning(f"Cache CLEAR ALL: {count} keys deleted")
                return True
            elif self.mode == "memory":
                count = len(self.memory_cache)
                self.memory_cache.clear()
                logger.warning(f"Cache CLEAR ALL (memory): {count} keys deleted")
                return True
        except Exception as e:
            logger.error(f"Cache CLEAR ALL error: {e}")
            return False
        
        return False
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache performance statistics."""
        total_requests = self.hits + self.misses
        hit_rate = (self.hits / total_requests * 100) if total_requests > 0 else 0
        
        stats = {
            "mode": self.mode,
            "enabled": self.enabled,
            "hits": self.hits,
            "misses": self.misses,
            "total_requests": total_requests,
            "hit_rate_percent": round(hit_rate, 2),
            "invalidations": self.invalidations
        }
        
        if self.mode == "memory":
            stats["memory_keys_count"] = len(self.memory_cache)
        
        return stats
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Check Redis connection health.
        
        Returns status dict with connection info.
        """
        health = {
            "mode": self.mode,
            "enabled": self.enabled,
            "status": "unknown"
        }
        
        if not self.enabled:
            health["status"] = "disabled"
            return health
        
        if self.mode == "memory":
            health["status"] = "ok"
            return health
        
        if self.mode == "redis" and self.redis_client:
            try:
                await self.redis_client.ping()
                health["status"] = "ok"
                health["redis_connected"] = True
            except Exception as e:
                health["status"] = "error"
                health["redis_connected"] = False
                health["error"] = str(e)
        
        return health


# Global cache client instance
cache_client = CacheClient()


async def invalidate_all_cache():
    """
    Invalidate all cache entries.
    
    Call this after seed operations or major data changes.
    """
    logger.info("Invalidating all cache entries")
    await cache_client.delete_pattern("*")


async def invalidate_layer_cache(layer_name: str):
    """
    Invalidate cache for a specific layer.
    
    Call this after PUT operations on a single layer.
    """
    logger.info(f"Invalidating cache for layer: {layer_name}")
    await cache_client.delete_pattern(f"{layer_name}:*")
    # Also invalidate aggregate endpoints
    await cache_client.delete("agent-summary:v1")
    await cache_client.delete("layers:v1")
