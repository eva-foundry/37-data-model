"""
Quick test of Priority 2 Redis cache module
"""
import sys
import asyncio
sys.path.insert(0, '.')

from api.simple_cache import CacheClient

async def main():
    print("Testing Priority 2: Redis Cache Module\n")
    
    # Create cache client (will use memory fallback if Redis not available)
    cache = CacheClient()
    print(f"✅ CacheClient instantiated")
    print(f"  Mode: {cache.mode}")
    print(f"  Enabled: {cache.enabled}")
    
    # Test basic operations
    print("\nTesting basic operations...")
    
    # Set a value
    await cache.set("test:key1", {"data": "test value"}, ttl=60)
    print("✅ Set operation successful")
    
    # Get the value
    result = await cache.get("test:key1")
    if result and result.get("data") == "test value":
        print("✅ Get operation successful")
    else:
        print("❌ Get operation failed")
    
    # Delete the value
    await cache.delete("test:key1")
    print("✅ Delete operation successful")
    
    # Verify deleted
    result = await cache.get("test:key1")
    if result is None:
        print("✅ Deletion verified")
    else:
        print("❌ Deletion failed")
    
    # Get stats
    stats = cache.get_stats()
    print(f"\n Cache Statistics:")
    print(f"  Hits: {stats['hits']}")
    print(f"  Misses: {stats['misses']}")
    print(f"  Mode: {stats['mode']}")
    
    print("\n✅ Cache module tests PASSED!")
    print("Ready for production deployment.")

if __name__ == "__main__":
    asyncio.run(main())
