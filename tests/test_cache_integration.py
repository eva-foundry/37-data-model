"""
Integration Tests for Cache Layer with API Routers

Demonstrates cache integration patterns with FastAPI layer routers.
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, Mock, patch
import json

from api.cache import (
    CacheLayer,
    MemoryCache,
    RedisCache,
    CacheInvalidationManager,
    WriteThroughCache,
    create_cache_layer,
    create_invalidation_manager
)


class MockCosmosRepository:
    """Mock Cosmos DB repository for testing"""
    
    def __init__(self):
        self.data = {}
        self.query_count = 0
        self.ru_consumed = 0
    
    async def get(self, entity_id: str):
        """Simulate Cosmos query"""
        self.query_count += 1
        self.ru_consumed += 10  # 10 RU per query
        
        if entity_id in self.data:
            return self.data[entity_id]
        return None
    
    async def create(self, entity_id: str, data: dict):
        """Create entity"""
        self.data[entity_id] = data
        return data
    
    async def update(self, entity_id: str, data: dict):
        """Update entity"""
        self.data[entity_id] = data
        return data
    
    async def delete(self, entity_id: str):
        """Delete entity"""
        if entity_id in self.data:
            del self.data[entity_id]
        return True


class CachedProjectRouter:
    """Example router with cache integration"""
    
    def __init__(self, cosmos_repo, cache_layer, invalidation_manager):
        self.cosmos = cosmos_repo
        self.cache = cache_layer
        self.invalidation = invalidation_manager
        self.write_through = WriteThroughCache(cache_layer, invalidation_manager)
    
    async def get_project(self, project_id: str):
        """Get project with cache"""
        cache_key = f"project:{project_id}"
        
        # Try cache first
        cached = await self.cache.get(cache_key)
        if cached:
            return cached
        
        # Query Cosmos
        project = await self.cosmos.get(project_id)
        
        # Populate cache
        if project:
            await self.cache.set(cache_key, project)
        
        return project
    
    async def create_project(self, project_id: str, data: dict):
        """Create project with cache invalidation"""
        # Write to Cosmos
        project = await self.cosmos.create(project_id, data)
        
        # Invalidate related caches
        await self.write_through.write_and_invalidate(
            entity_type='projects',
            entity_id=project_id,
            data=data,
            change_type='create'
        )
        
        return project
    
    async def update_project(self, project_id: str, data: dict):
        """Update project with cache invalidation"""
        # Write to Cosmos
        project = await self.cosmos.update(project_id, data)
        
        # Invalidate caches
        await self.write_through.write_and_invalidate(
            entity_type='projects',
            entity_id=project_id,
            data=data,
            change_type='update'
        )
        
        return project
    
    async def delete_project(self, project_id: str):
        """Delete project with cache invalidation"""
        # Delete from Cosmos
        result = await self.cosmos.delete(project_id)
        
        # Invalidate caches
        await self.write_through.write_and_invalidate(
            entity_type='projects',
            entity_id=project_id,
            data={},
            change_type='delete'
        )
        
        return result


class TestCachedRouterIntegration:
    """Integration tests for cache with API routers"""
    
    @pytest.mark.asyncio
    async def test_get_with_cache(self):
        """Test GET request benefits from cache"""
        
        # Setup
        cosmos = MockCosmosRepository()
        cache_layer = create_cache_layer()
        invalidation = create_invalidation_manager(cache_layer)
        router = CachedProjectRouter(cosmos, cache_layer, invalidation)
        
        # Populate Cosmos
        project_id = "proj-123"
        project_data = {"id": project_id, "name": "Test Project"}
        cosmos.data[project_id] = project_data
        
        # First request: Cosmos hit
        cosmos.query_count = 0
        result1 = await router.get_project(project_id)
        cosmic_queries_1 = cosmos.query_count
        
        # Second request: Cache hit
        cosmos.query_count = 0
        result2 = await router.get_project(project_id)
        cosmos_queries_2 = cosmos.query_count
        
        assert result1 == result2
        assert cosmic_queries_1 == 1  # First request hits Cosmos
        assert cosmos_queries_2 == 0  # Second request hits cache
    
    @pytest.mark.asyncio
    async def test_create_invalidates_cache(self):
        """Test CREATE invalidates list cache"""
        
        # Setup
        cosmos = MockCosmosRepository()
        cache_layer = create_cache_layer()
        invalidation = create_invalidation_manager(cache_layer)
        router = CachedProjectRouter(cosmos, cache_layer, invalidation)
        
        # Pre-warm cache with list
        cache_key = "project:list"
        await cache_layer.set(cache_key, {"items": []}, 300)
        
        # Create new project
        project_id = "proj-new"
        project_data = {"id": project_id, "name": "New Project"}
        
        await router.create_project(project_id, project_data)
        
        # List cache should be invalidated
        cached_list = await cache_layer.get(cache_key)
        assert cached_list is None  # Should be invalidated
    
    @pytest.mark.asyncio
    async def test_update_invalidates_entity_cache(self):
        """Test UPDATE invalidates entity cache"""
        
        # Setup
        cosmos = MockCosmosRepository()
        cache_layer = create_cache_layer()
        invalidation = create_invalidation_manager(cache_layer)
        router = CachedProjectRouter(cosmos, cache_layer, invalidation)
        
        project_id = "proj-123"
        original_data = {"id": project_id, "name": "Original Name"}
        cosmos.data[project_id] = original_data
        
        # Cache the original
        cache_key = f"project:{project_id}"
        await cache_layer.set(cache_key, original_data, 300)
        
        # Verify cached
        cached = await cache_layer.get(cache_key)
        assert cached == original_data
        
        # Update project
        updated_data = {"id": project_id, "name": "Updated Name"}
        result = await router.update_project(project_id, updated_data)
        
        # Cache should be invalidated
        cached = await cache_layer.get(cache_key)
        assert cached is None
        
        # Next GET will fetch updated data from Cosmos
        fetched = await router.get_project(project_id)
        assert fetched["name"] == "Updated Name"
    
    @pytest.mark.asyncio
    async def test_delete_invalidates_cache(self):
        """Test DELETE invalidates entity cache"""
        
        # Setup
        cosmos = MockCosmosRepository()
        cache_layer = create_cache_layer()
        invalidation = create_invalidation_manager(cache_layer)
        router = CachedProjectRouter(cosmos, cache_layer, invalidation)
        
        project_id = "proj-123"
        project_data = {"id": project_id, "name": "To Delete"}
        cosmos.data[project_id] = project_data
        
        # Cache it
        cache_key = f"project:{project_id}"
        await cache_layer.set(cache_key, project_data, 300)
        
        # Delete
        await router.delete_project(project_id)
        
        # Cache should be invalidated
        cached = await cache_layer.get(cache_key)
        assert cached is None
        
        # Cosmos should be empty
        cosmos_result = await cosmos.get(project_id)
        assert cosmos_result is None
    
    @pytest.mark.asyncio
    async def test_ru_savings(self):
        """Test RU consumption reduction with cache"""
        
        # Setup
        cosmos = MockCosmosRepository()
        cache_layer = create_cache_layer()
        invalidation = create_invalidation_manager(cache_layer)
        router = CachedProjectRouter(cosmos, cache_layer, invalidation)
        
        # Create test project
        project_id = "proj-123"
        project_data = {"id": project_id, "name": "Test Project"}
        cosmos.data[project_id] = project_data
        
        # Reset metrics
        cosmos.query_count = 0
        cosmos.ru_consumed = 0
        
        # Simulate 100 GET requests (cache hits after first)
        for _ in range(100):
            await router.get_project(project_id)
        
        # Should only hit Cosmos once
        print(f"\nRU Savings Analysis:")
        print(f"  Total requests: 100")
        print(f"  Cosmos queries: {cosmos.query_count}")
        print(f"  RU consumed: {cosmos.ru_consumed} (expected: 10)")
        print(f"  RU savings: {(1.0 - cosmos.query_count / 100) * 100:.1f}%")
        
        assert cosmos.query_count == 1  # Only first request
        assert cosmos.ru_consumed == 10  # 10 RU for single query
    
    @pytest.mark.asyncio
    async def test_concurrent_requests(self):
        """Test cache with concurrent requests"""
        
        # Setup
        cosmos = MockCosmosRepository()
        cache_layer = create_cache_layer()
        invalidation = create_invalidation_manager(cache_layer)
        router = CachedProjectRouter(cosmos, cache_layer, invalidation)
        
        # Create project
        project_id = "proj-123"
        project_data = {"id": project_id, "name": "Test Project"}
        cosmos.data[project_id] = project_data
        
        # Make concurrent requests
        tasks = [router.get_project(project_id) for _ in range(50)]
        results = await asyncio.gather(*tasks)
        
        # All should succeed
        assert len(results) == 50
        assert all(r == project_data for r in results)
        
        # Should have minimal Cosmos queries due to cache hits
        print(f"\nConcurrent Requests:")
        print(f"  Total requests: 50")
        print(f"  Cosmos queries: {cosmos.query_count}")
        
        # Some queries might hit Cosmos during cache population,
        # but most should hit cache
        assert cosmos.query_count < 10


class TestCacheWithMultipleLayers:
    """Test cache with multiple entity layers"""
    
    @pytest.mark.asyncio
    async def test_multiple_entity_types(self):
        """Test cache with projects, evidence, sprints"""
        
        # Setup
        cosmos = MockCosmosRepository()
        cache_layer = create_cache_layer()
        invalidation = create_invalidation_manager(cache_layer)
        
        # Simulate different entity types
        entities = {
            'projects': {'proj-1': {"id": "proj-1", "name": "Project 1"}},
            'evidence': {'ev-1': {"id": "ev-1", "type": "test"}},
            'sprints': {'sprint-1': {"id": "sprint-1", "name": "Sprint 1"}}
        }
        
        cosmos.ru_consumed = 0
        
        # Access each entity type multiple times
        for entity_type, items in entities.items():
            for entity_id, data in items.items():
                cosmos.data[entity_id] = data
                
                # First access: Cosmos hit
                cached = await cache_layer.get(f"{entity_type}:{entity_id}")
                if not cached:
                    # Query Cosmos
                    result = await cosmos.get(entity_id)
                    await cache_layer.set(f"{entity_type}:{entity_id}", result)
                
                # Subsequent accesses: Cache hit
                for _ in range(10):
                    result = await cache_layer.get(f"{entity_type}:{entity_id}")
                    assert result == data
        
        stats = await cache_layer.stats()
        
        print(f"\nMultiple Entity Types:")
        print(f"  Total cache hits: {stats['overall']['total_hits']}")
        print(f"  Total cache misses: {stats['overall']['total_misses']}")
        print(f"  Hit rate: {stats['overall']['hit_rate']:.1f}%")
        
        # Most requests should be cache hits
        assert stats['overall']['hit_rate'] > 70


@pytest.mark.asyncio
async def test_cache_invalidation_events():
    """Test invalidation event processing"""
    
    cache_layer = create_cache_layer()
    invalidation = create_invalidation_manager(cache_layer)
    
    # Pre-populate cache
    for i in range(10):
        await cache_layer.set(f"project:{i}", {"id": i}, 300)
    
    # Track invalidation events
    event_count = 0
    async def event_handler(event):
        nonlocal event_count
        event_count += 1
    
    invalidation.register_handler('projects', event_handler)
    
    # Start invalidation processing
    invalidation_task = asyncio.create_task(invalidation.start())
    
    try:
        # Emit events
        for i in range(5):
            await invalidation.invalidate_on_update('projects', f'proj-{i}')
        
        # Give some time for processing
        await asyncio.sleep(0.5)
        
        # Check that events were processed
        stats = invalidation.stats()
        print(f"\nInvalidation Events:")
        print(f"  Total events: {stats['total_events']}")
        print(f"  Total invalidated: {stats['total_invalidated_keys']}")
        print(f"  Queue size: {stats['queue_size']}")
        
        assert stats['total_events'] > 0
    
    finally:
        await invalidation.stop()
        invalidation_task.cancel()
        try:
            await invalidation_task
        except asyncio.CancelledError:
            pass


if __name__ == '__main__':
    pytest.main([__file__, '-v', '-s'])
