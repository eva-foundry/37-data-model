#!/usr/bin/env python3
"""Full integration test: start API with memory store and run seed"""
import asyncio
import sys
from pathlib import Path

# Add parent to path
sys.path.insert(0, str(Path(__file__).parents[1]))

async def test_seed():
    """Test complete seed operation with memory store"""
    from api.store.memory import MemoryStore
    from api.cache.memory import MemoryCache
    from api.routers.admin import seed
    
    print("\n=== INTEGRATION TEST: SEED WITH MEMORY STORE ===\n")
    
    # Create in-memory store and cache
    store = MemoryStore()
    cache = MemoryCache()
    actor = "test-user"
    
    #Dependency injection for seed function

    class FakeRequest:
        """Fake request for dependency injection"""
        pass
    
    # Call seed directly (bypassing FastAPI deps)
    result = await seed(store=store, cache=cache, actor=actor)
    
    # Print results
    print("\n=== SEED RESULTS ===\n")
    print(f"Total records: {result['total']:,}")
    print(f"Layers in definition: {result['layers_in_definition']}")
    print(f"Layers processed: {result['layers_processed']}")
    print(f"Layers with data: {result['layers_with_data']}")
    print(f"Layers skipped: {result['layers_skipped']}")
    print(f"Errors: {len(result['errors'])}")
    print(f"Duration: {result['duration_seconds']:.2f}s")
    
    if result['errors']:
        print("\n=== ERRORS ===")
        for err in result['errors'][:5]:  # Show first 5
            print(f"  - {err}")
    
    # Show layers with most records
    print("\n=== TOP 10 LAYERS BY RECORD COUNT ===")
    sorted_layers = sorted(result['seeded'].items(), key=lambda x: x[1], reverse=True)
    for layer, count in sorted_layers[:10]:
        print(f"  {layer}: {count:,}")
    
    # Show layers with 0 records (expected: evidence, traces, eva_model + missing files)
    zero_count_layers = [l for l, c in result['seeded'].items() if c == 0]
    if zero_count_layers:
        print(f"\n=== LAYERS WITH 0 RECORDS ({len(zero_count_layers)}) ===")
        for layer in zero_count_layers[:20]:
            print(f"  - {layer}")
    
    # Success criteria
    print("\n=== SUCCESS CRITERIA ===")
    success = True
    
    if result['total'] < 5000:
        print(f"[FAIL] Total records {result['total']} < 5000 expected")
        success = False
    else:
        print(f"[PASS] Total records {result['total']:,} >= 5000")
    
    if result['layers_processed'] < 80:
        print(f"[FAIL] Layers processed {result['layers_processed']} < 80 expected")
        success = False
    else:
        print(f"[PASS] Layers processed {result['layers_processed']} >= 80")
    
    if result['layers_with_data'] < 75:
        print(f"[FAIL] Layers with data {result['layers_with_data']} < 75 expected")
        success = False
    else:
        print(f"[PASS] Layers with data {result['layers_with_data']} >= 75")
    
    if len(result['errors']) > 0:
        print(f"[WARN] {len(result['errors'])} errors occurred")
    else:
        print(f"[PASS] No errors")
    
    return success

if __name__ == "__main__":
    success = asyncio.run(test_seed())
    sys.exit(0 if success else 1)
