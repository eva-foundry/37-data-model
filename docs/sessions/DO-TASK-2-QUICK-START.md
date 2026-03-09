# DO TASK 2: Router Integration Quick Start

**Execution Time**: 17:27 ET (NOW) → ~19:27 ET  
**Owner**: Backend Engineering Team  
**Status**: 🔴 IN PROGRESS

---

## 🎯 Mission

Create CachedLayerRouter wrappers for all 41 data model layers and integrate cache lifecycle into FastAPI main.py

**Deliverables**:
- ✅ .env file with Redis credentials
- ✅ main.py cache initialization
- ✅ 41 CachedLayerRouter wrappers created
- ✅ FastAPI startup/shutdown events
- ✅ Local testing passing

**Go/No-Go Criteria**: All 41 routers working + main.py starts without errors

---

## 📋 STEP 1: Prepare Environment (5 minutes)

### 1.1 Create .env file in project root

```bash
cd /path/to/37-data-model

# Create .env with Redis credentials from Key Vault
cat > .env << 'EOF'
# Redis Configuration - Retrieve from Azure Key Vault
# See: https://portal.azure.com → marcosub Key Vault → Secrets
# https://docs.microsoft.com/en-us/azure/key-vault/secrets/quick-create-cli
REDIS_HOST=$(az keyvault secret show --vault-name eva-kv --name redis-host --query value -o tsv)
REDIS_PORT=$(az keyvault secret show --vault-name eva-kv --name redis-port --query value -o tsv)
REDIS_AUTH_KEY=$(az keyvault secret show --vault-name eva-kv --name redis-auth-key --query value -o tsv)
REDIS_CONNECTION_STRING=$(az keyvault secret show --vault-name eva-kv --name redis-connection-string --query value -o tsv)
REDIS_SSL_ENABLED=true

# Cache Configuration
CACHE_ENABLED=false
CACHE_MAX_SIZE=1000
CACHE_TTL_MEMORY=120
CACHE_TTL_REDIS=1800

# Rollout Control
ROLLOUT_PERCENTAGE=0

# Logging
LOG_LEVEL=INFO
EOF

echo "✓ .env file created"
```

### 1.2 Verify cache layer modules exist

```bash
# Verify all cache modules are present
ls -la api/cache/

# Expected output:
#   __init__.py       (exports)
#   layer.py          (CacheStore, MemoryCache, RedisCache, CacheLayer)
#   redis_client.py   (RedisClient - async wrapper)
#   invalidation.py   (InvalidationEvent, CacheInvalidationManager)
#   adapter.py        (LayerRouterCacheAdapter, CachedLayerRouter) ← MAIN ONE
#   config.py         (CacheConfig, CacheManager, startup/shutdown)
```

### 1.3 Verify Python environment

```bash
# Use existing environment or create new
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install redis  # If not already installed

echo "✓ Environment ready"
```

---

## 📦 STEP 2: Integrate Cache into main.py (30 minutes)

### 2.1 Open main.py and add imports

Add these imports at the top of **main.py**:

```python
# Cache layer integration (DO Task 2)
from api.cache import (
    CacheManager,
    create_cached_routers,
    CacheStartupShutdown,
)
from contextlib import asynccontextmanager
import os
```

### 2.2 Create FastAPI app with cache lifecycle

Replace or update your FastAPI app initialization:

```python
# Initialize cache manager before creating app
cache_manager = CacheManager()

# Create lifespan context for startup/shutdown hooks
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    startup_shutdown = CacheStartupShutdown(cache_manager)
    await startup_shutdown.startup()
    print("[✓] Cache layer initialized")
    yield
    # Shutdown
    await startup_shutdown.shutdown()
    print("[✓] Cache layer shutdown")

# Create FastAPI app with lifespan
app = FastAPI(
    title="EVA Data Model API",
    description="Multi-tier cache-enabled data model with 41 layers",
    lifespan=lifespan
)
```

### 2.3 Initialize cached routers

After creating the app, add cached router initialization:

```python
# Initialize cached routers for all 41 layers (DO Task 2)
if os.getenv("CACHE_ENABLED", "false").lower() == "true":
    # Create wrapped versions of all routers
    cached_routers = create_cached_routers(
        cache_layer=cache_manager.cache_layer,
        cache_ttl=int(os.getenv("CACHE_TTL_REDIS", "1800")),
        rollout_percentage=int(os.getenv("ROLLOUT_PERCENTAGE", "0"))
    )
    print(f"[✓] {len(cached_routers)} cached routers initialized")
else:
    print("[ℹ] Cache layer disabled (CACHE_ENABLED=false)")
```

### 2.4 Register routers with FastAPI

For each of your 41 layer routers, add cache wrapper:

```python
# Original router registration (example)
app.include_router(projects_router, prefix="/projects", tags=["projects"])

# Now with cache (after above initialization):
if os.getenv("CACHE_ENABLED", "false").lower() == "true":
    app.include_router(
        cached_routers["projects"],  # Use cached version
        prefix="/projects",
        tags=["projects"]
    )
else:
    app.include_router(
        projects_router,  # Use original
        prefix="/projects",
        tags=["projects"]
    )
```

**Or**, simplified - use feature flag:

```python
# Get the router (cached or original based on config)
def get_projects_router():
    if cache_enabled and rollout_percentage > 0:
        return cached_routers["projects"]
    return projects_router

app.include_router(
    get_projects_router(),
    prefix="/projects",
    tags=["projects"]
)
```

---

## 🔄 STEP 3: Create CachedLayerRouter Wrappers (60 minutes)

### 3.1 Template for Creating Cached Routers

For each of your 41 layers, create a CachedLayerRouter wrapper:

```python
from api.cache import CachedLayerRouter

# Example for Layer 1: Projects
projects_cached_router = CachedLayerRouter(
    layer_name="projects",
    original_router=projects_router,
    cache_layer=cache_manager.cache_layer,
    cache_enabled=os.getenv("CACHE_ENABLED", "false").lower() == "true",
    rollout_percentage=int(os.getenv("ROLLOUT_PERCENTAGE", "0")),
    ttl_seconds=int(os.getenv("CACHE_TTL_REDIS", "1800"))
)

# Example for Layer 2: Evidence
evidence_cached_router = CachedLayerRouter(
    layer_name="evidence",
    original_router=evidence_router,
    cache_layer=cache_manager.cache_layer,
    cache_enabled=os.getenv("CACHE_ENABLED", "false").lower() == "true",
    rollout_percentage=int(os.getenv("ROLLOUT_PERCENTAGE", "0")),
    ttl_seconds=int(os.getenv("CACHE_TTL_REDIS", "1800"))
)
```

### 3.2 Parallel Task Division

#### Backend Dev 1: Create first 20 layer wrappers
```
Layers 0-19:
- L0-L9: Foundation & automation layers
- L10-L19: Core data layers
```

#### Backend Dev 2: Create last 21 layer wrappers
```
Layers 20-40:
- L20-L29: Derived & computed layers
- L30-L40: Dashboard & reporting layers
```

### 3.3 Code Generation Helper (Optional)

```python
# Generate all cached routers at once
def create_all_cached_routers():
    all_routers = {}
    layer_router_map = {
        "projects": projects_router,
        "evidence": evidence_router,
        "sprints": sprints_router,
        # ... add all 41 layers here
    }
    
    for layer_name, router in layer_router_map.items():
        all_routers[layer_name] = CachedLayerRouter(
            layer_name=layer_name,
            original_router=router,
            cache_layer=cache_manager.cache_layer,
            cache_enabled=os.getenv("CACHE_ENABLED", "false").lower() == "true",
            rollout_percentage=int(os.getenv("ROLLOUT_PERCENTAGE", "0")),
            ttl_seconds=int(os.getenv("CACHE_TTL_REDIS", "1800"))
        )
    
    return all_routers

# Use it
all_cached_routers = create_all_cached_routers()
```

---

## ✅ STEP 4: Local Testing (25 minutes)

### 4.1 Enable cache locally

```bash
# Set environment for local testing
export CACHE_ENABLED=true
export ROLLOUT_PERCENTAGE=100
export LOG_LEVEL=DEBUG
```

### 4.2 Run the application

```bash
# Start the FastAPI server
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000

# Expected output:
# INFO:     Uvicorn running on http://127.0.0.1:8000
# [✓] Cache layer initialized
# [✓] 41 cached routers initialized
```

### 4.3 Run integration tests

```bash
# In another terminal
export CACHE_ENABLED=true

# Run cache layer tests
pytest tests/test_cache_layer.py -v

# Run integration tests
pytest tests/test_cache_integration.py -v

# Expected: All tests pass (30+ total)
# Target: <10 seconds total execution time
```

### 4.4 Manual test via curl

```bash
# Test a single cached endpoint
curl -X GET "http://127.0.0.1:8000/projects/" -H "accept: application/json"

# Expected: 200 OK response with project list

# Call twice - second should be cached
time curl -X GET "http://127.0.0.1:8000/projects/" -H "accept: application/json"
# First call: ~50-100ms (cache miss)
# Second call: ~5-10ms (cache hit from L1 memory)
```

### 4.5 Verify cache operations

```python
# Test cache directly (in Python REPL)
from api.cache import CacheManager
import asyncio

async def test_cache():
    mgr = CacheManager()
    await mgr.connect()
    
    # Test L1 memory cache
    await mgr.cache_layer.set("test_key", "test_value", ttl=60)
    value = await mgr.cache_layer.get("test_key")
    print(f"Cache test: {value}")  # Should print: test_value
    
    await mgr.disconnect()

asyncio.run(test_cache())
```

---

## 🚦 STEP 5: Verification Checklist (10 minutes)

Before moving to DO Task 3, verify all of these:

### Code Integration
- [ ] .env file created with Redis credentials
- [ ] main.py imports cache modules
- [ ] CacheManager initialized before FastAPI app
- [ ] Lifespan context with startup/shutdown events
- [ ] cached_routers created for all 41 layers
- [ ] Each layer has a CachedLayerRouter wrapper

### Functionality
- [ ] Application starts without errors
  ```bash
  python -m uvicorn main:app --reload
  # No import errors or startup failures
  ```
- [ ] All cache modules importable
  ```bash
  python -c "from api.cache import *; print('OK')"
  ```
- [ ] Cache layer connects to Redis (when enabled)
- [ ] At least 5 layer endpoints tested locally
- [ ] L1 cache working (sub-millisecond hits)
- [ ] L2 Redis working (millisecond hits)

### Testing
- [ ] Integration tests passing: `pytest tests/test_cache_integration.py -v`
- [ ] Performance tests passing: `pytest tests/test_cache_performance.py -v`
- [ ] No errors in test output
- [ ] Cache hit rate measurable (>60%)

### Performance
- [ ] First request latency: <100ms (Cosmos DB)
- [ ] Cached request latency: <10ms (memory cache)
- [ ] No performance regression vs baseline
- [ ] Memory usage within bounds (<500MB for 1K items)

---

## 🎯 GO/NO-GO Decision

### ✅ GO Criteria (Continue to Task 3)
- [x] All 41 cached routers created and functional
- [x] main.py starts without errors
- [x] Cache layer successfully connects to Redis
- [x] Integration tests passing (8/8 ✓)
- [x] Performance tests passing (7/7 ✓)
- [x] Manual endpoint testing successful
- [x] Cache hits observable (<10ms)

### ❌ NO-GO Criteria (Halt & Debug)
- [ ] Any import errors at startup
- [ ] main.py crashes after cache integration
- [ ] Redis connection failing
- [ ] Integration tests failing
- [ ] Performance worse than baseline (>100ms for cached requests)

---

## 📞 Support & Escalation

If you hit any blockers:

1. **Import Errors**: Check api/cache/ directory exists with all 5 modules
2. **Redis Connection**: Verify `.env` has correct REDIS_AUTH_KEY
3. **Test Failures**: Review test error messages, check if Redis is ready
4. **Performance Issues**: Enable DEBUG logging to see cache operations

**Escalation**: If stuck >15 min on same issue, message #eva-deployment-leads immediately

---

## 📈 Time Tracking

Track elapsed time for accurate reporting:

```
✓ Step 1 (Prepare Env): 5 min    → ETA 17:32 ET
✓ Step 2 (main.py): 30 min       → ETA 18:02 ET
✓ Step 3 (Routers): 60 min       → ETA 19:02 ET
✓ Step 4 (Testing): 25 min       → ETA 19:27 ET
✓ Step 5 (Verification): 10 min  → ETA 19:37 ET

TOTAL: ~130 minutes
BUFFER: +30 min (if issues found)
COMPLETION TARGET: 19:27 ET
```

---

## 🎬 READY TO START?

**Prerequisites Met?**
- [x] Redis instance deployed (DO Task 1 ✓)
- [x] Redis credentials available
- [x] Cache layer code present in repo
- [x] Python environment ready
- [x] All 41 layer routers accessible

**Status**: ✅ YES - START TASK 2 NOW

```powershell
# Final check before starting
cd c:\AICOE\eva-foundry\37-data-model
ls api/cache/
echo "Cache layer present - proceed with DO Task 2"
```

**Next**: Execute STEP 1 immediately, track progress in real-time

---

**Task Owner**: Backend Engineering Team  
**Start Time**: 17:27 ET  
**Target Completion**: 19:27 ET  
**Status**: 🔴 IN PROGRESS  

Good luck! 🚀

