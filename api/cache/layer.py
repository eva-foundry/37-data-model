"""
Cache Layer Implementation for EVA Data Model API

Multi-tier (L1: Memory, L2: Redis, L3: Cosmos) caching strategy
with automatic fallthrough and TTL-based expiration.
"""

import json
import logging
from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from typing import Any, Optional
import re

logger = logging.getLogger(__name__)


class CacheStore(ABC):
    """Abstract base class for cache stores"""

    @abstractmethod
    async def get(self, key: str) -> Optional[Any]:
        """Retrieve value from cache"""

    @abstractmethod
    async def set(self, key: str, value: Any, ttl_seconds: int) -> bool:
        """Store value in cache with TTL"""

    @abstractmethod
    async def delete(self, key: str) -> bool:
        """Delete key from cache"""

    @abstractmethod
    async def delete_pattern(self, pattern: str) -> int:
        """Delete all keys matching pattern"""

    @abstractmethod
    async def stats(self) -> dict:
        """Get cache statistics"""


class MemoryCache(CacheStore):
    """In-process memory cache (L1)"""

    def __init__(self, max_size: int = 1000):
        self.cache: dict[str, dict[str, Any]] = {}
        self.max_size = max_size
        self.hits = 0
        self.misses = 0

    async def get(self, key: str) -> Optional[Any]:
        """Retrieve from memory cache"""
        if key in self.cache:
            entry = self.cache[key]

            # Check expiration
            if entry['expires_at'] > datetime.now():
                self.hits += 1
                return entry['value']
            else:
                # Expired, remove it
                del self.cache[key]

        self.misses += 1
        return None

    async def set(self, key: str, value: Any, ttl_seconds: int) -> bool:
        """Store in memory cache"""
        if len(self.cache) >= self.max_size:
            # Simple eviction: remove oldest entry
            oldest_key = min(self.cache,
                             key=lambda k: self.cache[k]['created_at'])
            del self.cache[oldest_key]

        self.cache[key] = {
            'value': value,
            'expires_at': datetime.now() + timedelta(seconds=ttl_seconds),
            'created_at': datetime.now(),
            'size_bytes': len(json.dumps(value).encode())
        }
        return True

    async def delete(self, key: str) -> bool:
        """Remove from memory cache"""
        if key in self.cache:
            del self.cache[key]
            return True
        return False

    async def delete_pattern(self, pattern: str) -> int:
        """Remove all matching keys"""
        regex = re.compile(pattern.replace('*', '.*'))
        keys_to_delete = [k for k in self.cache if regex.match(k)]

        for key in keys_to_delete:
            del self.cache[key]

        return len(keys_to_delete)

    async def stats(self) -> dict:
        """Get memory cache statistics"""
        total_size = sum(e.get('size_bytes', 0) for e in self.cache.values())
        total_requests = self.hits + self.misses
        hit_rate = (
            self.hits /
            total_requests *
            100) if total_requests > 0 else 0

        return {
            'store': 'memory',
            'entries': len(self.cache),
            'hits': self.hits,
            'misses': self.misses,
            'hit_rate': round(hit_rate, 2),
            'total_size_bytes': total_size,
            'max_size': self.max_size,
            'evictions': 0  # Track separately if needed
        }


class RedisCache(CacheStore):
    """Distributed Redis cache (L2)"""

    def __init__(self, redis_client):
        """Initialize with redis client"""
        self.redis = redis_client
        self.hits = 0
        self.misses = 0

    async def get(self, key: str) -> Optional[Any]:
        """Retrieve from Redis cache"""
        try:
            value = self.redis.get(key)
            if value:
                self.hits += 1
                return json.loads(value)
            self.misses += 1
            return None
        except Exception as e:
            logger.error(f"Redis get error: {e}")
            return None

    async def set(self, key: str, value: Any, ttl_seconds: int) -> bool:
        """Store in Redis cache"""
        try:
            self.redis.setex(key, ttl_seconds, json.dumps(value))
            return True
        except Exception as e:
            logger.error(f"Redis set error: {e}")
            return False

    async def delete(self, key: str) -> bool:
        """Remove from Redis cache"""
        try:
            return bool(self.redis.delete(key))
        except Exception as e:
            logger.error(f"Redis delete error: {e}")
            return False

    async def delete_pattern(self, pattern: str) -> int:
        """Remove all matching keys from Redis"""
        try:
            keys = self.redis.keys(pattern)
            if keys:
                return self.redis.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"Redis delete_pattern error: {e}")
            return 0

    async def stats(self) -> dict:
        """Get Redis cache statistics"""
        try:
            info = self.redis.info('stats')
            total_requests = self.hits + self.misses
            hit_rate = (
                self.hits /
                total_requests *
                100) if total_requests > 0 else 0

            return {
                'store': 'redis',
                'connected': True,
                'hits': self.hits,
                'misses': self.misses,
                'hit_rate': round(
                    hit_rate,
                    2),
                'evictions': info.get(
                    'evicted_keys',
                    0),
                'total_commands_processed': info.get(
                    'total_commands_processed',
                    0),
            }
        except Exception as e:
            logger.error(f"Redis stats error: {e}")
            return {
                'store': 'redis',
                'connected': False,
                'error': str(e)
            }


class CacheLayer:
    """Multi-tier cache layer (L1: Memory, L2: Redis, L3: Cosmos)"""

    def __init__(self,
                 memory_cache: Optional[MemoryCache] = None,
                 redis_cache: Optional[RedisCache] = None,
                 cosmos_store=None,
                 ttl_memory_seconds: int = 120,
                 ttl_redis_seconds: int = 1800):
        """Initialize cache layer

        Args:
            memory_cache: L1 in-process cache (defaults to new instance)
            redis_cache: L2 distributed cache (optional)
            cosmos_store: L3 data store (Cosmos DB)
            ttl_memory_seconds: TTL for L1 cache (default: 2 minutes)
            ttl_redis_seconds: TTL for L2 cache (default: 30 minutes)
        """
        self.l1 = memory_cache or MemoryCache(max_size=1000)
        self.l2 = redis_cache
        self.l3 = cosmos_store

        self.ttl_l1 = ttl_memory_seconds
        self.ttl_l2 = ttl_redis_seconds

        self.total_hits = 0
        self.total_misses = 0
        self.cosmos_queries = 0

    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache, with L1 → L2 → L3 fallthrough"""

        # L1: Check memory cache
        try:
            value = await self.l1.get(key)
            if value is not None:
                self.total_hits += 1
                return value
        except Exception as e:
            logger.warning(f"L1 cache error: {e}")

        # L2: Check Redis (if enabled)
        if self.l2:
            try:
                value = await self.l2.get(key)
                if value is not None:
                    # Populate L1 for next request
                    await self.l1.set(key, value, self.ttl_l1)
                    self.total_hits += 1
                    return value
            except Exception as e:
                logger.warning(f"L2 cache error: {e}")

        # L3: Query Cosmos DB (source of truth)
        if self.l3:
            try:
                value = await self.l3.get(key)
                if value is not None:
                    # Populate L1 + L2 for next requests
                    await self.l1.set(key, value, self.ttl_l1)
                    if self.l2:
                        await self.l2.set(key, value, self.ttl_l2)
                    self.cosmos_queries += 1
                    return value
            except Exception as e:
                logger.error(f"L3 (Cosmos) query error: {e}")

        self.total_misses += 1
        return None

    async def set(
            self,
            key: str,
            value: Any,
            ttl_seconds: Optional[int] = None) -> bool:
        """Set value in cache (L1 + L2)

        Args:
            key: Cache key
            value: Value to cache
            ttl_seconds: Optional TTL override (uses defaults if not provided)
        """

        ttl_l1 = ttl_seconds or self.ttl_l1
        ttl_l2 = ttl_seconds or self.ttl_l2

        # Write to L1
        try:
            await self.l1.set(key, value, ttl_l1)
        except Exception as e:
            logger.warning(f"L1 set error: {e}")

        # Write to L2 (if enabled)
        if self.l2:
            try:
                await self.l2.set(key, value, ttl_l2)
            except Exception as e:
                logger.warning(f"L2 set error: {e}")

        return True

    async def invalidate(self, key: str) -> bool:
        """Invalidate key across all cache layers"""

        results = []

        # Invalidate L1
        try:
            results.append(await self.l1.delete(key))
        except Exception as e:
            logger.warning(f"L1 delete error: {e}")

        # Invalidate L2
        if self.l2:
            try:
                results.append(await self.l2.delete(key))
            except Exception as e:
                logger.warning(f"L2 delete error: {e}")

        return any(results)

    async def invalidate_pattern(self, pattern: str) -> int:
        """Invalidate all keys matching pattern"""

        total_deleted = 0

        # L1
        try:
            total_deleted += await self.l1.delete_pattern(pattern)
        except Exception as e:
            logger.warning(f"L1 delete_pattern error: {e}")

        # L2
        if self.l2:
            try:
                total_deleted += await self.l2.delete_pattern(pattern)
            except Exception as e:
                logger.warning(f"L2 delete_pattern error: {e}")

        return total_deleted

    async def stats(self) -> dict:
        """Get comprehensive cache statistics"""

        l1_stats = await self.l1.stats()
        l2_stats = (await self.l2.stats()) if self.l2 else None

        total_requests = self.total_hits + self.total_misses
        overall_hit_rate = (
            self.total_hits /
            total_requests *
            100) if total_requests > 0 else 0

        return {
            'timestamp': datetime.now().isoformat(),
            'overall': {
                'total_hits': self.total_hits,
                'total_misses': self.total_misses,
                'hit_rate': round(overall_hit_rate, 2),
                'cosmos_queries': self.cosmos_queries,
                'total_requests': total_requests
            },
            'l1_memory': l1_stats,
            'l2_redis': l2_stats,
            'ttl_configs': {
                'l1_seconds': self.ttl_l1,
                'l2_seconds': self.ttl_l2
            }
        }


# Factory function for easy instance creation
def create_cache_layer(
        redis_client=None,
        cosmos_store=None,
        ttl_memory_seconds=120,
        ttl_redis_seconds=1800) -> CacheLayer:
    """Factory to create configured cache layer"""

    memory_cache = MemoryCache(max_size=1000)
    redis_cache = RedisCache(redis_client) if redis_client else None

    return CacheLayer(
        memory_cache=memory_cache,
        redis_cache=redis_cache,
        cosmos_store=cosmos_store,
        ttl_memory_seconds=ttl_memory_seconds,
        ttl_redis_seconds=ttl_redis_seconds
    )
