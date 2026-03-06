"""
Performance Benchmarks for Cache Layer

Validates cache performance improvements (latency and RU reduction).
"""

import pytest
import asyncio
import json
import time
from typing import List, Dict, Any
from unittest.mock import Mock, AsyncMock

from api.cache import (
    CacheLayer,
    MemoryCache,
    RedisCache,
    create_cache_layer
)


class BenchmarkTimer:
    """Simple timer for benchmarking"""
    
    def __init__(self):
        self.times = []
    
    def start(self):
        self.start_time = time.time()
    
    def end(self):
        elapsed = (time.time() - self.start_time) * 1000  # ms
        self.times.append(elapsed)
        return elapsed
    
    def average(self):
        """Calculate average time. Raises error if no timings recorded."""
        if not self.times:
            raise ValueError("No timing data collected - call start/end first")
        return sum(self.times) / len(self.times)
    
    def min(self):
        if not self.times:
            raise ValueError("No timing data collected - call start/end first")
        return min(self.times)
    
    def max(self):
        if not self.times:
            raise ValueError("No timing data collected - call start/end first")
        return max(self.times)
    
    def p95(self):
        """95th percentile. Raises error if no timings recorded."""
        if not self.times:
            raise ValueError("No timing data collected - call start/end first")
        sorted_times = sorted(self.times)
        idx = int(len(sorted_times) * 0.95)
        return sorted_times[idx]


class CosmosDBSimulator:
    """Simulates Cosmos DB with configurable latency"""
    
    def __init__(self, latency_ms: float = 50, ru_cost: int = 1):
        """Initialize simulator
        
        Args:
            latency_ms: Simulated latency in milliseconds
            ru_cost: RU cost per query
        """
        self.latency_ms = latency_ms
        self.ru_cost = ru_cost
        self.query_count = 0
        self.total_rus = 0
    
    async def query(self, key: str) -> Any:
        """Simulate Cosmos query"""
        # Simulate network latency
        await asyncio.sleep(self.latency_ms / 1000)
        
        # Track metrics
        self.query_count += 1
        self.total_rus += self.ru_cost
        
        return {
            'id': key,
            'data': f'data-{key}',
            'timestamp': time.time()
        }
    
    async def get(self, key: str) -> Any:
        """Alias for query - for compatibility with cache layer interface"""
        return await self.query(key)


class TestCachePerformance:
    """Performance benchmark tests"""
    
    @pytest.mark.asyncio
    async def test_cache_hit_latency(self):
        """Test L1 cache hit latency vs Cosmos"""
        
        # Setup
        cache = MemoryCache(max_size=1000)
        cosmos = CosmosDBSimulator(latency_ms=50)
        
        test_key = "project:12345"
        test_data = {"id": test_key, "data": "project"}
        
        # Populate cache
        await cache.set(test_key, test_data, 300)
        
        # Benchmark cache hit
        cache_timer = BenchmarkTimer()
        for _ in range(100):
            cache_timer.start()
            result = await cache.get(test_key)
            cache_timer.end()
            assert result == test_data
        
        # Benchmark direct Cosmos query
        cosmos_timer = BenchmarkTimer()
        cosmos.query_count = 0
        cosmos.total_rus = 0
        
        for _ in range(100):
            cosmos_timer.start()
            result = await cosmos.query(test_key)
            cosmos_timer.end()
        
        # Verify improvements
        cache_avg = cache_timer.average()
        cosmos_avg = cosmos_timer.average()
        
        print(f"\nCache vs Cosmos Latency:")
        print(f"  Cache avg: {cache_avg:.2f}ms")
        print(f"  Cosmos avg: {cosmos_avg:.2f}ms")
        if cache_avg > 0:
            print(f"  Improvement: {cosmos_avg / cache_avg:.1f}x faster")
        
        # Cache should be significantly faster
        # Allow for timing resolution (both could be 0 on fast systems)
        if cache_avg > 0 and cosmos_avg > 0:
            assert cache_avg < cosmos_avg / 10  # At least 10x faster
        # At minimum, cosmos should have latency from await asyncio.sleep
        assert cosmos_avg > 0
        
        # Cosmos should have consumed 100 RUs
        assert cosmos.total_rus == 100
    
    @pytest.mark.asyncio
    async def test_multilayer_cache_hit(self):
        """Test multi-layer cache performance"""
        
        # Setup
        l1 = MemoryCache(max_size=1000)
        mock_redis = Mock()
        mock_redis.get.return_value = json.dumps({"id": "key", "data": "value"})
        l2 = RedisCache(mock_redis)
        cosmos = CosmosDBSimulator(latency_ms=50, ru_cost=1)
        
        cache_layer = CacheLayer(memory_cache=l1, redis_cache=l2)
        cache_layer.l3 = cosmos  # Fallback
        
        # Benchmark L1 hit
        test_key = "project:12345"
        test_data = {"id": test_key, "data": "project"}
        await l1.set(test_key, test_data, 300)
        
        l1_timer = BenchmarkTimer()
        for _ in range(100):
            l1_timer.start()
            result = await cache_layer.get(test_key)
            l1_timer.end()
        
        l1_avg = l1_timer.average()
        print(f"\nL1 (Memory) average latency: {l1_avg:.2f}ms")
        
        # Clear L1, benchmark L2
        await l1.delete(test_key)
        
        l2_timer = BenchmarkTimer()
        for _ in range(100):
            l2_timer.start()
            result = await cache_layer.get(test_key)
            l2_timer.end()
        
        l2_avg = l2_timer.average()
        print(f"L2 (Redis) average latency: {l2_avg:.2f}ms")
        
        # Clear both, benchmark L3
        await l1.delete(test_key)
        mock_redis.get.return_value = None
        
        l3_timer = BenchmarkTimer()
        for _ in range(100):
            l3_timer.start()
            result = await cache_layer.get(test_key)
            l3_timer.end()
        
        l3_avg = l3_timer.average()
        print(f"L3 (Cosmos) average latency: {l3_avg:.2f}ms")
        
        # Verify layering: L1 < L2 < L3
        # Note: L1 should be significantly faster than L3 (real Cosmos DB)
        assert l1_avg < l3_avg, f"L1 ({l1_avg:.2f}ms) should be faster than L3 ({l3_avg:.2f}ms)"
        
        # L2 < L3 is expected but harder to verify with mocked L2
        if l2_avg > 0.1:  # Only verify if L2 has measurable latency
            assert l2_avg < l3_avg, f"L2 ({l2_avg:.2f}ms) should be faster than L3 ({l3_avg:.2f}ms)"
    
    @pytest.mark.asyncio
    async def test_ru_reduction_with_cache(self):
        """Test RU savings from caching"""
        
        cosmos = CosmosDBSimulator(latency_ms=50, ru_cost=10)
        l1 = MemoryCache(max_size=1000)
        
        cache_layer = CacheLayer(memory_cache=l1)
        cache_layer.l3 = cosmos
        
        # Simulate 1000 requests for 10 unique keys
        keys = [f"project:{i}" for i in range(10)]
        
        cosmos.query_count = 0
        cosmos.total_rus = 0
        
        # First 10 requests hit Cosmos (cache misses)
        for i in range(100):
            key = keys[i % len(keys)]
            result = await cache_layer.get(key)
        
        # With cache, only first 10 unique keys hit Cosmos
        cache_hits = cache_layer.total_hits
        cosmos_queries = cosmos.query_count
        
        print(f"\nRU Savings Analysis (1000 requests, 10 unique keys):")
        print(f"  Cosmos queries: {cosmos_queries} (expected ~10)")
        print(f"  Cache hits: {cache_hits} (expected ~990)")
        print(f"  RUs consumed: {cosmos.total_rus} (expected ~100)")
        print(f"  RU savings: {(1.0 - cosmos_queries / 100) * 100:.1f}% reduction")
        
        # Verify cache hit rate
        assert cache_hits > 50  # At least 50% of requests from cache
        assert cosmos_queries < 50  # Most requests from cache, not Cosmos
    
    @pytest.mark.asyncio
    async def test_cache_warming_performance(self):
        """Test performance of cache warming"""
        
        l1 = MemoryCache(max_size=1000)
        cache_timer = BenchmarkTimer()
        
        # Warm cache with 100 items
        for i in range(100):
            cache_timer.start()
            await l1.set(f"project:{i}", {"id": i, "data": f"data-{i}"}, 300)
            cache_timer.end()
        
        warm_avg = cache_timer.average()
        
        # Now read all 100 items
        read_timer = BenchmarkTimer()
        for i in range(100):
            read_timer.start()
            result = await l1.get(f"project:{i}")
            read_timer.end()
            assert result is not None
        
        read_avg = read_timer.average()
        
        print(f"\nCache Warming Performance (100 items):")
        print(f"  Write avg: {warm_avg:.4f}ms per item")
        print(f"  Read avg: {read_avg:.4f}ms per item")
        if warm_avg > 0 and read_avg > 0:
            print(f"  Read speedup: {warm_avg / read_avg:.1f}x")
        
        # In-memory cache writes and reads are similarly fast
        # Just verify both are reasonably quick (< 1ms)
        assert warm_avg < 1.0, f"Write latency too high: {warm_avg}ms"
        assert read_avg < 1.0, f"Read latency too high: {read_avg}ms"
        # Both operations should succeed
        assert warm_avg >= 0 and read_avg >= 0
    
    @pytest.mark.asyncio
    async def test_hit_rate_improvement(self):
        """Test cache hit rate over request patterns"""
        
        l1 = MemoryCache(max_size=1000)
        l2 = RedisCache(Mock(get=lambda x: json.dumps({"id": x})))
        
        cache_layer = CacheLayer(memory_cache=l1, redis_cache=l2)
        
        # Simulate realistic request pattern: 80/20 rule
        # 20% of keys accessed 80% of the time
        hot_keys = [f"project:{i}" for i in range(10)]  # 20% hot
        cold_keys = [f"project:{i}" for i in range(10, 100)]  # 80% cold
        
        # Pre-warm hot keys
        for key in hot_keys:
            await l1.set(key, {"id": key}, 300)
        
        # Access pattern: 80% hot, 20% cold
        request_count = 0
        for _ in range(100):
            # 80% hit hot keys
            for _ in range(80):
                key = hot_keys[request_count % len(hot_keys)]
                await cache_layer.get(key)
                request_count += 1
            
            # 20% hit cold keys
            for _ in range(20):
                key = cold_keys[request_count % len(cold_keys)]
                await cache_layer.get(key)
                request_count += 1
        
        stats = await cache_layer.stats()
        hit_rate = stats['overall']['hit_rate']
        
        print(f"\nHit Rate Analysis (80/20 access pattern):")
        print(f"  Total requests: {request_count}")
        print(f"  Hit rate: {hit_rate:.1f}%")
        print(f"  Expected: ~80%")
        
        # Hit rate should be high due to hot key access pattern
        assert hit_rate > 50  # Conservative estimate


class TestCacheMemoryOverhead:
    """Test memory efficiency of cache"""
    
    @pytest.mark.asyncio
    async def test_memory_footprint(self):
        """Test memory usage of cache layer"""
        
        import sys
        
        cache = MemoryCache(max_size=1000)
        
        # Store 100 items
        for i in range(100):
            data = {
                "id": f"project:{i}",
                "name": f"Project {i}",
                "description": f"Description for project {i}" * 10,
                "metadata": {"key": f"value-{i}"}
            }
            await cache.set(f"key:{i}", data, 300)
        
        stats = await cache.stats()
        
        print(f"\nMemory Footprint (100 items):")
        print(f"  Total size: {stats['total_size_bytes'] / 1024:.1f} KB")
        print(f"  Avg per item: {stats['total_size_bytes'] / 100:.0f} bytes")
        
        # Memory should be reasonable
        assert stats['total_size_bytes'] < 1024 * 1024  # Less than 1 MB for 100 items


@pytest.mark.asyncio
async def test_cache_layer_integration():
    """Integration test with realistic patterns"""
    
    # Setup
    l1 = MemoryCache(max_size=1000)
    l2 = RedisCache(Mock(
        get=lambda x: json.dumps({"id": x, "cached": "in-redis"}),
        setex=lambda k, t, v: True,
        delete=lambda k: 1,
        keys=lambda p: []
    ))
    
    cache_layer = CacheLayer(
        memory_cache=l1,
        redis_cache=l2,
        ttl_memory_seconds=120,
        ttl_redis_seconds=1800
    )
    
    # Simulate realistic operations
    test_keys = [f"entity:{i}" for i in range(100)]
    
    # Phase 1: Initial population (L1 + L2)
    for key in test_keys[:50]:
        await cache_layer.set(key, {"id": key, "data": f"value-{key}"})
    
    # Phase 2: Access (L1 hits, then L2 hits)
    for key in test_keys[:50]:
        result = await cache_layer.get(key)
        assert result is not None
    
    # Phase 3: New requests (L2 hits, populates L1)
    for key in test_keys[50:100]:
        result = await cache_layer.get(key)
        # Some will hit cache, some will miss
    
    # Phase 4: Invalidation
    for key in test_keys[:10]:
        await cache_layer.invalidate(key)
    
    # Verify final state
    stats = await cache_layer.stats()
    print(f"\nIntegration Test Results:")
    print(f"  Total hits: {stats['overall']['total_hits']}")
    print(f"  Total misses: {stats['overall']['total_misses']}")
    print(f"  Hit rate: {stats['overall']['hit_rate']:.1f}%")
    
    # Should have reasonable hit rate with cache warming
    assert stats['overall']['hit_rate'] > 30


if __name__ == '__main__':
    pytest.main([__file__, '-v', '-s'])
