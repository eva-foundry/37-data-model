# Local vs Cloud Store Drift Analysis

**Status**: Development environment (MemoryStore) vs Production (CosmosStore)  
**Goal**: Identify drift points and close the gap for production parity

---

## 1. BULK LOAD PERFORMANCE (CRITICAL DRIFT)

### Problem
**MemoryStore** (lines 129-172):
- Per-object locking with `async with self._lock` inside the loop
- Calls `get_one()` for each object sequentially (if checking for existing)
- Cost: O(N) lock acquisitions + O(N) individual get operations = serial bottleneck
- For 960 objects: ~960 lock ops + potential N² behavior if unused

**CosmosStore** (lines 140-201):
- Single bulk fetch: `existing_list = await self.get_all(layer, active_only=False)` 
  - ONE query retrieves all existing objects
- Build lookup map in pure Python (no I/O)
- Parallel upserts: `asyncio.gather()` behind `Semaphore(concurrency=50)`
- Cost: 1 read + O(N/50) parallel batches
- For 960 objects: ~1 query + ~20 parallel batches = ~40x faster theoretical throughput

### Why It Matters
- Cold-deploy seed operations (initialization) can involve hundreds/thousands of objects
- Memory store locks are held **per object** during bulk_load
- This serializes all other requests during the seed operation
- In cloud: parallel upserts don't block readers (Cosmos async I/O)

### Impact
- **Local dev**: Slow cold starts for large layer files, blocks other requests
- **Cloud**: Scales linearly with concurrency settings
- **Gap**: Dev doesn't reflect production performance characteristics

---

## 2. BULK LOAD LOCK GRANULARITY (HIGH DRIFT)

### Memory Store Issues
```python
# CURRENT (memory.py:129-172)
count = 0
now = _now()
for obj in objects:
    obj_id = str(obj.get("id", ""))
    if not obj_id:
        continue
    async with self._lock:  # ← Lock INSIDE loop - per object!
        if layer not in self._data:
            self._data[layer] = {}
        existing = self._data[layer].get(obj_id)
        # ... build doc ...
        self._data[layer][obj_id] = doc
    count += 1
```

**Problems**:
1. Lock held for full object processing (not just data structure mutation)
2. Blocks OTHER readers/writers on ANY layer (single `_lock`)
3. 960-object seed = 960 lock acquisitions + context switches
4. Each other request must wait for its turn

### Cosmos Approach
```python
# Step 1: Fetch all at once (1 query, 1 lock conceptually)
existing_list = await self.get_all(layer, active_only=False)

# Step 2: Build docs in parallel (no lock needed - pure Python)
docs = [... build all docs in Python ...]

# Step 3: Parallel upserts (50 concurrent requests, no blocking)
async def _upsert(d):
    async with sem:  # ← Per-request semaphore, NOT per-store
        await self._container.upsert_item(body=d)
await asyncio.gather(*[_upsert(d) for d in docs])
```

### Better Pattern for Memory Store
```python
# Fetch all existing objects ONCE (no lock during fetch)
existing_list = await self.get_all(layer, active_only=False)
existing_map = {str(e.get("obj_id", "")): e for e in existing_list}

# Build all docs (pure Python, no lock, no I/O)
docs = [...]

# Single batch update (lock once, not per-object)
async with self._lock:
    if layer not in self._data:
        self._data[layer] = {}
    for doc in docs:
        self._data[layer][obj_id] = doc
```

---

## 3. AUDIT TRAIL BEHAVIOR (MEDIUM DRIFT)

### MemoryStore (memory.py:107-119)
```python
async def get_audit(self, limit: int = 50) -> list[dict[str, Any]]:
    rows = []
    for layer, bucket in self._data.items():
        for doc in bucket.values():
            rows.append({
                "layer": layer,
                "obj_id": doc.get("obj_id"),
                "modified_by": doc.get("modified_by"),
                "modified_at": doc.get("modified_at"),
                "row_version": doc.get("row_version"),
                "is_active": doc.get("is_active", True),
            })
    rows.sort(key=lambda r: r.get("modified_at") or "", reverse=True)
    return rows[:limit]
```

**Issues**:
- Scans ALL layers + ALL records in memory
- In-process sort (no index, no query optimization)
- No partition/layer filtering at query time
- For 1M+ records: O(N) full scan + O(N log N) sort

### CosmosStore (cosmos.py:201-216)
```python
async def get_audit(self, limit: int = 50) -> list[dict[str, Any]]:
    query = (
        "SELECT c.layer, c.obj_id, c.modified_by, c.modified_at, c.row_version, c.is_active "
        "FROM c ORDER BY c.modified_at DESC OFFSET 0 LIMIT @limit")
    params = [{"name": "@limit", "value": limit}]
    rows = []
    async for item in self._container.query_items(
        query=query, parameters=params, enable_cross_partition_query=True
    ):
        rows.append(item)
    return rows
```

**Benefits**:
- Indexed query on `modified_at` (composite index defined)
- Server-side sort (Cosmos sorts before sending)
- Limits at query time (not after fetching all)
- Supports `enable_cross_partition_query` to query across layers efficiently

### Gap
- Dev environment: O(N) full scans on every audit call
- Cloud: O(log N) indexed lookups with limit pushed down
- Audit API would be slow in dev with large datasets

---

## 4. CONCURRENCY MODEL (MEDIUM DRIFT)

### MemoryStore
- **Single asyncio.Lock** for the entire store
- All layers, all objects contend for one lock
- Other requests blocked during any write
- "Fair but slow"

### CosmosStore
- No explicit lock (Cosmos handles concurrency at service level)
- Parallel requests execute concurrently at cloud service
- No local contention
- "Parallel by design"

### Example: 3 concurrent requests
**Memory**:
- Request A acquires lock, reserves obj1 in layer1, sleeps
- Request B waits on lock
- Request C waits on lock
- A releases → B acquires lock → C waits
- Result: Sequential execution

**Cosmos**:
- Request A: upserts obj1 in layer1 (async I/O)
- Request B: upserts obj2 in layer2 (async I/O) — parallel!
- Request C: queries layer3 (async I/O) — parallel!
- Result: All 3 concurrent at service level

---

## 5. DOCUMENT ID HANDLING (LOW DRIFT - Cosmetic)

### MemoryStore
- Stores as: `{layer: {obj_id: {obj_id, layer, ...rest}}}`
- Direct obj_id lookup
- Response includes doc as-is

### CosmosStore
- Encodes ID: `id = base64url(layer + "::" + obj_id)`
- Stores with encoded `id` field in Cosmos
- Strips Cosmos internals in response: `_strip()` removes `_rid`, `_self`, `_etag`, `_ts`
- Returns `obj_id` as `id` to client

### Why It Matters
- Cosmos must avoid banned chars: `/`, `?`, `#`, `\`
- Memory doesn't have this constraint
- Response format differs slightly
- Not a functional issue but documentation gap

---

## 6. ERROR HANDLING (LOW DRIFT)

### MemoryStore (memory.py)
```python
async def get_one(self, layer: str, obj_id: str) -> dict[str, Any] | None:
    doc = self._data.get(layer, {}).get(obj_id)
    return deepcopy(doc) if doc is not None else None
```

### CosmosStore (cosmos.py)
```python
async def get_one(self, layer: str, obj_id: str) -> dict[str, Any] | None:
    doc_id = _cosmos_id(layer, obj_id)
    try:
        item = await self._container.read_item(item=doc_id, partition_key=layer)
        return _strip(item)
    except exceptions.CosmosResourceNotFoundError:
        return None
```

**Difference**:
- Memory: Catches nothing (can't fail)
- Cosmos: Catches and handles `CosmosResourceNotFoundError`

**Gap**: Dev never tests exception handling paths that would occur in prod

---

## What SHOULD Be Different (Intentional)

1. **Persistence**: MemoryStore is ephemeral, CosmosStore persists ✓
2. **Scalability**: MemoryStore is single-process, CosmosStore is multi-tenant ✓
3. **Indexes**: Cosmos defines indexes, memory can't configure them ✓
4. **Failover**: Cosmos has built-in HA, memory doesn't ✓

---

## What COULD Be the Same (Closing the Gap)

| Issue | Current | Recommendation | Effort |
|-------|---------|-----------------|--------|
| **bulk_load performance** | Serial per-object locks | Parallel batching with semaphore | Medium |
| **bulk_load lock granularity** | Lock per object | Single batch lock | Low |
| **audit query** | Full O(N) scan + sort | Indexed query simulation | Medium |
| **concurrency model** | Single global lock | Per-layer locks or async-native | Medium |
| **error handling** | Silent success | Simulate Cosmos exceptions | Low |
| **document IDs** | Direct obj_id | Encode/decode (simulation) | Low |
| **response format** | Raw docs | Strip internal fields | Low |

---

## Recommended Fixes (Priority Order)

### PRIORITY 1: Fix bulk_load Performance (High Impact)
**Why**: Cold-start performance directly affects dev friction  
**Effort**: Medium (refactor loop structure)  
**Impact**: 10-50x faster seed operations

```python
# Memory store: Match Cosmos parallelization pattern
async def bulk_load(self, layer, objects, actor):
    now = _now()
    
    # Step 1: Fetch existing (single logical operation)
    existing_list = await self.get_all(layer, active_only=False)
    existing_map = {str(e.get("obj_id")): e for e in existing_list}
    
    # Step 2: Build all docs (no I/O)
    docs = [...]  # build all
    
    # Step 3: Single batch update (lock once)
    async with self._lock:
        if layer not in self._data:
            self._data[layer] = {}
        for doc in docs:
            self._data[layer][doc["obj_id"]] = doc
    
    return len(docs)
```

### PRIORITY 2: Fix audit Query Performance (Medium Impact)
**Why**: Audit API would be slow with large datasets  
**Effort**: Medium (add index simulation)  
**Impact**: Audit operations scale to production dataset sizes

```python
# Add in __init__:
self._audit_index = []  # [(modified_at, layer, obj_id, data)]

# On every upsert/soft_delete: update audit_index
# get_audit(): Query via index, apply limit

# Or: Build on-demand with indexed sort
async def get_audit(self, limit=50):
    rows = []
    for layer, bucket in self._data.items():
        for doc in bucket.values():
            rows.append(...)
    # Same as now, but pre-sorted by modified_at during upsert
    return sorted(rows, key=..., reverse=True)[:limit]
```

### PRIORITY 3: Per-Layer Locking (Medium Impact)
**Why**: Reduces contention for concurrent requests on different layers  
**Effort**: Medium (change from single Lock to dict of Locks)  
**Impact**: Better concurrent request handling in dev

```python
# Change from:
self._lock = asyncio.Lock()

# To:
self._locks = {layer: asyncio.Lock() for layer in _LAYERS}

# Usage:
async with self._locks[layer]:  # Lock only this layer
    ...
```

---

## Testing the Gap

To validate local-dev parity:

```bash
# 1. Seed large dataset locally
curl -X POST http://localhost:8010/admin/seed-layer \
  -H "X-Admin-Token: dev" \
  -d '{"layer": "work_factory_capabilities", "count": 1000}'

# Measure time locally vs cloud:
# - Local MemoryStore: serial bulk_load → ~500ms
# - Cloud CosmosStore: parallel bulk_load → ~50ms
# Gap = 10x even for same data size

# 2. Query audit with 10k+ records
curl http://localhost:8010/model/agent-audit?limit=50

# Time local audit (O(N) scan):
# - 10k records: ~10ms (N/1000)
# - 1M records: ~1000ms (N/1000)
# Cloud audit (indexed):
# - 10k records: ~5ms (index lookup)
# - 1M records: ~5ms (index lookup)
# Gap = 200x at scale
```

---

## Do They Need to Be Different?

**No for correctness.** The API contract is identical; clients shouldn't care. Both stores satisfy `AbstractStore`.

**Yes for performance.** Dev should catch performance regressions before prod. If dev is 100x slower, you never know the code has a perf bug until cloud.

**The goal**: Make MemoryStore as realistic as possible without persistence.

