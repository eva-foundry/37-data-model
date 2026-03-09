"""
Redis Client Wrapper for EVA Data Model API

Async Redis operations with connection pooling and error handling.
Supports both standalone and managed identity authentication.
"""
from __future__ import annotations

import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)


class RedisClient:
    """Async Redis client wrapper with connection pooling"""

    def __init__(self,
                 host: str,
                 port: int = 6380,
                 password: Optional[str] = None,
                 db: int = 0,
                 ssl: bool = True,
                 decode_responses: bool = True,
                 max_connections: int = 50):
        """Initialize Redis client

        Args:
            host: Redis host (e.g., 'myredis.redis.cache.windows.net')
            port: Redis port (default: 6380 for TLS)
            password: Auth key/password
            db: Database number (default: 0)
            ssl: Use SSL/TLS (default: True for Azure Redis)
            decode_responses: Decode responses as strings (default: True)
            max_connections: Max connection pool size
        """
        self.host = host
        self.port = port
        self.password = password
        self.db = db
        self.ssl = ssl
        self.decode_responses = decode_responses
        self.max_connections = max_connections

        self._pool = None
        self._redis = None
        self._connected = False

    async def connect(self) -> bool:
        """Establish Redis connection pool"""
        try:
            import redis.asyncio as redis

            # Create connection pool
            self._pool = redis.ConnectionPool(
                host=self.host,
                port=self.port,
                password=self.password,
                db=self.db,
                ssl=self.ssl,
                decode_responses=self.decode_responses,
                max_connections=self.max_connections,
                socket_connect_timeout=5,
                socket_keepalive=True,
                socket_keepalive_options={
                    1: 1,  # TCP_KEEPIDLE
                    2: 1,  # TCP_KEEPINTVL
                    3: 3,  # TCP_KEEPCNT
                }
            )

            # Create client
            self._redis = redis.Redis(connection_pool=self._pool)

            # Test connection
            await self._redis.ping()
            self._connected = True
            logger.info(f"Redis connected to {self.host}:{self.port}")
            return True

        except Exception as e:
            logger.error(f"Redis connection failed: {e}")
            self._connected = False
            return False

    async def disconnect(self) -> None:
        """Close Redis connection"""
        if self._redis:
            await self._redis.close()
        if self._pool:
            await self._pool.disconnect()
        self._connected = False
        logger.info("Redis disconnected")

    async def is_connected(self) -> bool:
        """Check if Redis is connected"""
        if not self._connected or not self._redis:
            return False

        try:
            await self._redis.ping()
            return True
        except Exception:
            self._connected = False
            return False

    async def get(self, key: str) -> Optional[str]:
        """Get value from Redis"""
        if not await self.is_connected():
            return None

        try:
            return await self._redis.get(key)
        except Exception as e:
            logger.error(f"Redis get error for key '{key}': {e}")
            return None

    async def set(
            self,
            key: str,
            value: str,
            ex: Optional[int] = None) -> bool:
        """Set value in Redis with optional expiration

        Args:
            key: Cache key
            value: Value to cache (should be JSON string)
            ex: Expiration time in seconds
        """
        if not await self.is_connected():
            return False

        try:
            result = await self._redis.set(key, value, ex=ex)
            return bool(result)
        except Exception as e:
            logger.error(f"Redis set error for key '{key}': {e}")
            return False

    async def setex(self, key: str, seconds: int, value: str) -> bool:
        """Set value with expiration time

        Args:
            key: Cache key
            seconds: Expiration time in seconds
            value: Value to cache (JSON string)
        """
        return await self.set(key, value, ex=seconds)

    async def delete(self, *keys: str) -> int:
        """Delete one or more keys"""
        if not await self.is_connected():
            return 0

        try:
            return await self._redis.delete(*keys)
        except Exception as e:
            logger.error(f"Redis delete error: {e}")
            return 0

    async def exists(self, *keys: str) -> int:
        """Check if keys exist"""
        if not await self.is_connected():
            return 0

        try:
            return await self._redis.exists(*keys)
        except Exception as e:
            logger.error(f"Redis exists error: {e}")
            return 0

    async def expire(self, key: str, seconds: int) -> bool:
        """Set expiration on existing key"""
        if not await self.is_connected():
            return False

        try:
            result = await self._redis.expire(key, seconds)
            return bool(result)
        except Exception as e:
            logger.error(f"Redis expire error for key '{key}': {e}")
            return False

    async def ttl(self, key: str) -> int:
        """Get TTL of key (-2: doesn't exist, -1: no expiration)"""
        if not await self.is_connected():
            return -2

        try:
            return await self._redis.ttl(key)
        except Exception as e:
            logger.error(f"Redis ttl error for key '{key}': {e}")
            return -2

    async def keys(self, pattern: str = '*') -> list[str]:
        """Get keys matching pattern"""
        if not await self.is_connected():
            return []

        try:
            return await self._redis.keys(pattern)
        except Exception as e:
            logger.error(f"Redis keys error: {e}")
            return []

    async def scan(self, cursor: int = 0, match: str = '*', count: int = 100):
        """Scan keys (non-blocking)"""
        if not await self.is_connected():
            return 0, []

        try:
            return await self._redis.scan(cursor, match=match, count=count)
        except Exception as e:
            logger.error(f"Redis scan error: {e}")
            return 0, []

    async def mget(self, *keys: str) -> list[Optional[str]]:
        """Get multiple values"""
        if not await self.is_connected():
            return [None] * len(keys)

        try:
            return await self._redis.mget(*keys)
        except Exception as e:
            logger.error(f"Redis mget error: {e}")
            return [None] * len(keys)

    async def mset(self, mapping: dict[str, str]) -> bool:
        """Set multiple key-value pairs"""
        if not await self.is_connected():
            return False

        try:
            result = await self._redis.mset(mapping)
            return bool(result)
        except Exception as e:
            logger.error(f"Redis mset error: {e}")
            return False

    async def incr(self, key: str) -> int:
        """Increment counter"""
        if not await self.is_connected():
            return 0

        try:
            return await self._redis.incr(key)
        except Exception as e:
            logger.error(f"Redis incr error for key '{key}': {e}")
            return 0

    async def decr(self, key: str) -> int:
        """Decrement counter"""
        if not await self.is_connected():
            return 0

        try:
            return await self._redis.decr(key)
        except Exception as e:
            logger.error(f"Redis decr error for key '{key}': {e}")
            return 0

    async def lpush(self, key: str, *values: str) -> int:
        """Push to list (left side)"""
        if not await self.is_connected():
            return 0

        try:
            return await self._redis.lpush(key, *values)
        except Exception as e:
            logger.error(f"Redis lpush error for key '{key}': {e}")
            return 0

    async def rpush(self, key: str, *values: str) -> int:
        """Push to list (right side)"""
        if not await self.is_connected():
            return 0

        try:
            return await self._redis.rpush(key, *values)
        except Exception as e:
            logger.error(f"Redis rpush error for key '{key}': {e}")
            return 0

    async def lpop(self, key: str) -> Optional[str]:
        """Pop from list (left side)"""
        if not await self.is_connected():
            return None

        try:
            return await self._redis.lpop(key)
        except Exception as e:
            logger.error(f"Redis lpop error for key '{key}': {e}")
            return None

    async def rpop(self, key: str) -> Optional[str]:
        """Pop from list (right side)"""
        if not await self.is_connected():
            return None

        try:
            return await self._redis.rpop(key)
        except Exception as e:
            logger.error(f"Redis rpop error for key '{key}': {e}")
            return None

    async def lrange(
            self,
            key: str,
            start: int = 0,
            stop: int = -
            1) -> list[str]:
        """Get range from list"""
        if not await self.is_connected():
            return []

        try:
            return await self._redis.lrange(key, start, stop)
        except Exception as e:
            logger.error(f"Redis lrange error for key '{key}': {e}")
            return []

    async def sadd(self, key: str, *members: str) -> int:
        """Add to set"""
        if not await self.is_connected():
            return 0

        try:
            return await self._redis.sadd(key, *members)
        except Exception as e:
            logger.error(f"Redis sadd error for key '{key}': {e}")
            return 0

    async def smembers(self, key: str) -> set[str]:
        """Get all members of set"""
        if not await self.is_connected():
            return set()

        try:
            return await self._redis.smembers(key)
        except Exception as e:
            logger.error(f"Redis smembers error for key '{key}': {e}")
            return set()

    async def flushdb(self) -> bool:
        """Flush current database"""
        if not await self.is_connected():
            return False

        try:
            result = await self._redis.flushdb()
            return bool(result)
        except Exception as e:
            logger.error(f"Redis flushdb error: {e}")
            return False

    async def dbsize(self) -> int:
        """Get number of keys in database"""
        if not await self.is_connected():
            return 0

        try:
            return await self._redis.dbsize()
        except Exception as e:
            logger.error(f"Redis dbsize error: {e}")
            return 0

    async def info(self, section: str = 'default') -> dict:
        """Get Redis server info"""
        if not await self.is_connected():
            return {}

        try:
            return await self._redis.info(section)
        except Exception as e:
            logger.error(f"Redis info error: {e}")
            return {}

    async def ping(self) -> bool:
        """Ping Redis server"""
        try:
            await self._redis.ping()
            return True
        except Exception:
            return False


def create_redis_client(redis_host: str,
                        redis_password: Optional[str] = None,
                        redis_port: int = 6380) -> RedisClient:
    """Factory to create Redis client from environment or parameters"""

    host = redis_host or os.getenv('REDIS_HOST', 'localhost')
    password = redis_password or os.getenv('REDIS_PASSWORD')
    port = redis_port or int(os.getenv('REDIS_PORT', '6380'))

    return RedisClient(
        host=host,
        port=port,
        password=password,
        ssl=True,  # Always use SSL for Azure Redis
        decode_responses=True
    )
