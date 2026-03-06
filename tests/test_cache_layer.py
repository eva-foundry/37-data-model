"""
Unit Tests for Cache Layer

Tests for memory cache, Redis cache, and multi-tier cache layer.
"""

import pytest
import asyncio
import json
from datetime import datetime
from unittest.mock import Mock, AsyncMock, patch

from api.cache.layer import (
    MemoryCache,
    RedisCache,
    CacheLayer,
    create_cache_layer
)
from api.cache.redis_client import RedisClient
from api.cache.invalidation import (
    InvalidationEvent,
    CacheInvalidationManager,
    WriteThroughCache
)


class TestMemoryCache:
    """Test MemoryCache implementation"""
    
    @pytest.mark.asyncio
    async def test_set_and_get(self):
        """Test basic set and get operations"""
        cache = MemoryCache()
        
        test_data = {"name": "test", "value": 123}
        await cache.set("key1", test_data, 300)
        
        result = await cache.get("key1")
        assert result == test_data
    
    @pytest.mark.asyncio
    async def test_expiration(self):
        """Test key expiration"""
        cache = MemoryCache()
        
        # Set with 1 second TTL
        await cache.set("key1", "value", 1)
        
        # Should exist immediately
        result = await cache.get("key1")
        assert result == "value"
        
        # Wait for expiration
        await asyncio.sleep(1.1)
        
        # Should be expired now
        result = await cache.get("key1")
        assert result is None
    
    @pytest.mark.asyncio
    async def test_delete(self):
        """Test key deletion"""
        cache = MemoryCache()
        
        await cache.set("key1", "value", 300)
        assert await cache.delete("key1") is True
        
        result = await cache.get("key1")
        assert result is None
    
    @pytest.mark.asyncio
    async def test_delete_pattern(self):
        """Test pattern-based deletion"""
        cache = MemoryCache()
        
        await cache.set("project:1", "data1", 300)
        await cache.set("project:2", "data2", 300)
        await cache.set("evidence:1", "data3", 300)
        
        deleted = await cache.delete_pattern("project:*")
        assert deleted == 2
        
        # project keys should be gone
        assert await cache.get("project:1") is None
        assert await cache.get("project:2") is None
        
        # evidence key should still exist
        assert await cache.get("evidence:1") == "data3"
    
    @pytest.mark.asyncio
    async def test_stats(self):
        """Test statistics tracking"""
        cache = MemoryCache()
        
        await cache.set("key1", "value", 300)
        
        # Generate hits
        await cache.get("key1")
        await cache.get("key1")
        
        # Generate misses
        await cache.get("nonexistent")
        
        stats = await cache.stats()
        assert stats['hits'] == 2
        assert stats['misses'] == 1
        assert stats['entries'] == 1
    
    @pytest.mark.asyncio
    async def test_max_size_eviction(self):
        """Test eviction when max size exceeded"""
        cache = MemoryCache(max_size=2)
        
        await cache.set("key1", "value1", 300)
        await cache.set("key2", "value2", 300)
        await cache.set("key3", "value3", 300)  # Should evict key1
        
        stats = await cache.stats()
        assert stats['entries'] == 2


class TestRedisCache:
    """Test RedisCache implementation"""
    
    @pytest.mark.asyncio
    async def test_set_and_get(self):
        """Test Redis set and get"""
        mock_redis = Mock()
        mock_redis.get.return_value = json.dumps({"name": "test"})
        
        cache = RedisCache(mock_redis)
        
        test_data = {"name": "test"}
        await cache.set("key1", test_data, 300)
        
        mock_redis.setex.assert_called_once()
        
        result = await cache.get("key1")
        assert result == test_data
    
    @pytest.mark.asyncio
    async def test_delete(self):
        """Test Redis delete"""
        mock_redis = Mock()
        mock_redis.delete.return_value = 1
        
        cache = RedisCache(mock_redis)
        
        result = await cache.delete("key1")
        assert result is True
        mock_redis.delete.assert_called_once_with("key1")
    
    @pytest.mark.asyncio
    async def test_delete_pattern(self):
        """Test Redis pattern deletion"""
        mock_redis = Mock()
        mock_redis.keys.return_value = ["project:1", "project:2"]
        mock_redis.delete.return_value = 2
        
        cache = RedisCache(mock_redis)
        
        deleted = await cache.delete_pattern("project:*")
        assert deleted == 2
        mock_redis.delete.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_error_handling(self):
        """Test error handling"""
        mock_redis = Mock()
        mock_redis.get.side_effect = Exception("Connection error")
        
        cache = RedisCache(mock_redis)
        
        result = await cache.get("key1")
        assert result is None


class TestCacheLayer:
    """Test multi-tier CacheLayer"""
    
    @pytest.mark.asyncio
    async def test_l1_cache_hit(self):
        """Test L1 (memory) cache hit"""
        l1 = MemoryCache()
        cache_layer = CacheLayer(memory_cache=l1)
        
        test_data = {"name": "test"}
        await l1.set("key1", test_data, 300)
        
        result = await cache_layer.get("key1")
        assert result == test_data
    
    @pytest.mark.asyncio
    async def test_l2_fallthrough(self):
        """Test fallthrough from L1 to L2"""
        l1 = MemoryCache()
        mock_redis = Mock()
        mock_redis.get.return_value = json.dumps({"name": "from_redis"})
        l2 = RedisCache(mock_redis)
        
        cache_layer = CacheLayer(memory_cache=l1, redis_cache=l2)
        
        # Set only in L2
        result = await cache_layer.get("key1")
        
        assert result == {"name": "from_redis"}
        
        # Should now be in L1 too
        l1_result = await l1.get("key1")
        assert l1_result == {"name": "from_redis"}
    
    @pytest.mark.asyncio
    async def test_set_both_layers(self):
        """Test that set populates both L1 and L2"""
        l1 = MemoryCache()
        mock_redis = Mock()
        mock_redis.setex.return_value = True
        l2 = RedisCache(mock_redis)
        
        cache_layer = CacheLayer(memory_cache=l1, redis_cache=l2)
        
        test_data = {"name": "test"}
        await cache_layer.set("key1", test_data)
        
        # Check L1
        l1_result = await l1.get("key1")
        assert l1_result == test_data
        
        # Check L2 call
        mock_redis.setex.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_invalidate(self):
        """Test cache invalidation"""
        l1 = MemoryCache()
        mock_redis = Mock()
        mock_redis.delete.return_value = 1
        l2 = RedisCache(mock_redis)
        
        cache_layer = CacheLayer(memory_cache=l1, redis_cache=l2)
        
        await l1.set("key1", "value", 300)
        
        # Invalidate
        await cache_layer.invalidate("key1")
        
        # Should be gone from L1
        assert await l1.get("key1") is None
        
        # Should call L2 delete
        mock_redis.delete.assert_called_once_with("key1")
    
    @pytest.mark.asyncio
    async def test_stats(self):
        """Test cache layer statistics"""
        l1 = MemoryCache()
        cache_layer = CacheLayer(memory_cache=l1)
        
        await l1.set("key1", "value", 300)
        await cache_layer.get("key1")
        await cache_layer.get("nonexistent")
        
        stats = await cache_layer.stats()
        assert stats['overall']['total_hits'] == 1
        assert stats['overall']['total_misses'] == 1


class TestInvalidationEvent:
    """Test InvalidationEvent"""
    
    def test_event_creation(self):
        """Test event creation"""
        event = InvalidationEvent(
            change_type='update',
            entity_type='projects',
            entity_id='proj-123',
            affected_keys=['project:proj-123'],
            affected_patterns=['project:proj-123:*']
        )
        
        assert event.change_type == 'update'
        assert event.entity_type == 'projects'
        assert event.entity_id == 'proj-123'
    
    def test_event_to_dict(self):
        """Test event serialization"""
        event = InvalidationEvent(
            change_type='update',
            entity_type='projects',
            entity_id='proj-123',
            affected_keys=['project:proj-123'],
            affected_patterns=['project:proj-123:*']
        )
        
        event_dict = event.to_dict()
        assert event_dict['change_type'] == 'update'
        assert 'timestamp' in event_dict


class TestCacheInvalidationManager:
    """Test CacheInvalidationManager"""
    
    @pytest.mark.asyncio
    async def test_register_handler(self):
        """Test handler registration"""
        manager = CacheInvalidationManager()
        
        handler = AsyncMock()
        manager.register_handler('projects', handler)
        
        assert 'projects' in manager.event_handlers
    
    @pytest.mark.asyncio
    async def test_emit_event(self):
        """Test event emission"""
        manager = CacheInvalidationManager()
        
        event = InvalidationEvent(
            change_type='update',
            entity_type='projects',
            entity_id='proj-123',
            affected_keys=['project:proj-123'],
            affected_patterns=[]
        )
        
        await manager.emit_event(event)
        
        # Event should be in queue
        assert not manager.event_queue.empty()
    
    @pytest.mark.asyncio
    async def test_process_event(self):
        """Test event processing"""
        l1 = MemoryCache()
        cache_layer = CacheLayer(memory_cache=l1)
        manager = CacheInvalidationManager(cache_layer=cache_layer)
        
        # Set a key
        await l1.set("project:proj-123", "data", 300)
        
        # Create invalidation event
        event = InvalidationEvent(
            change_type='update',
            entity_type='projects',
            entity_id='proj-123',
            affected_keys=['project:proj-123'],
            affected_patterns=[]
        )
        
        # Process event
        invalidated = await manager.process_event(event)
        
        assert invalidated >= 1
        # Key should be gone
        assert await l1.get("project:proj-123") is None
    
    @pytest.mark.asyncio
    async def test_cascading_invalidation(self):
        """Test cascading invalidation"""
        l1 = MemoryCache()
        cache_layer = CacheLayer(memory_cache=l1)
        manager = CacheInvalidationManager(cache_layer=cache_layer)
        
        # Set multiple related keys
        await l1.set("project:proj-123", "data1", 300)
        await l1.set("evidence:ev-123", "data2", 300)
        await l1.set("sprint:s-123", "data3", 300)
        
        # Delete project -> should cascade
        event = InvalidationEvent(
            change_type='delete',
            entity_type='projects',
            entity_id='proj-123',
            affected_keys=['project:proj-123'],
            affected_patterns=['project:*']
        )
        
        await manager.process_event(event)
        
        # Cascading invalidations should have been tracked
        stats = manager.stats()
        assert stats['cascading_invalidations'] >= 1
    
    @pytest.mark.asyncio
    async def test_stats(self):
        """Test manager statistics"""
        manager = CacheInvalidationManager()
        
        stats = manager.stats()
        assert 'total_events' in stats
        assert 'total_invalidated_keys' in stats
        assert 'queue_size' in stats


class TestWriteThroughCache:
    """Test WriteThroughCache pattern"""
    
    @pytest.mark.asyncio
    async def test_write_and_invalidate_update(self):
        """Test write-through update"""
        l1 = MemoryCache()
        cache_layer = CacheLayer(memory_cache=l1)
        manager = CacheInvalidationManager(cache_layer=cache_layer)
        
        write_through = WriteThroughCache(cache_layer, manager)
        
        result = await write_through.write_and_invalidate(
            entity_type='projects',
            entity_id='proj-123',
            data={'name': 'new project'},
            change_type='update'
        )
        
        assert result is True
    
    @pytest.mark.asyncio
    async def test_cache_and_return(self):
        """Test cache and return"""
        l1 = MemoryCache()
        cache_layer = CacheLayer(memory_cache=l1)
        manager = CacheInvalidationManager(cache_layer=cache_layer)
        
        write_through = WriteThroughCache(cache_layer, manager)
        
        data = {'name': 'test'}
        result = await write_through.cache_and_return('key1', data, 300)
        
        assert result == data
        assert await l1.get('key1') == data


@pytest.mark.asyncio
async def test_create_cache_layer_factory():
    """Test cache layer factory function"""
    cache = create_cache_layer()
    
    assert cache is not None
    assert cache.l1 is not None
    assert isinstance(cache.l1, MemoryCache)


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
