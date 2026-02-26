# EVA Data Model — Real Audit Trail Enhancement

**Component:** 37-data-model  
**Epic type:** Enhancement  
**Created:** 2026-02-22  
**Status:** Idea — not yet onboarded to ADO  
**Depends on:** Epic 164 (Maintenance & Extension) — in progress  
**github_repo:** eva-foundry/37-data-model

---

## Context

The current `GET /model/admin/audit` endpoint returns a **projection of current
object state**, sorted by `modified_at`. It answers "what was recently touched"
but cannot answer "what changed, who changed it, and what did it look like before."

Discovered Feb 22, 2026 during a review of the write cycle protocol. Root cause:
`get_audit()` in both MemoryStore and CosmosStore reads from the live object store
rather than from a separate, append-only change-event log.

### What the current implementation cannot answer

| Question | Current | Needed |
|---|---|---|
| What did object X look like before this change? | No | `old_value` snapshot |
| What specific fields changed? | No | `diff: {field: [old, new]}` |
| Was this a CREATE, UPDATE, or SOFT_DELETE? | No | `operation` enum |
| Full history of `personas::admin` across all time | No | Append-only event rows |
| Which events came from one `seed` call? | No | `correlation_id` grouping |
| Rollback object to `row_version=3` | No | `new_value` snapshot enables replay |

### Why a separate container is required

Storing audit metadata inside the live object means:
- The audit record is **overwritten** on every subsequent change
- The record **disappears** when the object is soft-deleted or re-seeded
- `GET /model/admin/audit` after a full re-seed shows every object as if just
  created — the prior change history is gone

The fix mirrors the pattern already used in `33-eva-brain-v2`
(`app/services/audit_log_service.py`): a dedicated Cosmos container
(`audit_events`, partition key `/layer`, TTL optional) that is **append-only**.

---

## Epic

**Title:** EVA Data Model — Real Audit Trail (Append-Only Change History)  
**Goal:** Every write to the model store (CREATE, UPDATE, SOFT_DELETE) produces
an immutable event record capturing the actor, timestamp, operation, `old_value`
and `new_value` snapshots, and a field-level diff. The audit log survives object
deletion and re-seed, supports per-object history queries, and enables rollback
by replaying `new_value` snapshots.

---

## Features

| ID | Title | Summary |
|----|-------|---------|
| dm-audit-f1 | Audit Event Schema & Abstract Contract | Pydantic `AuditEvent` model + `append_audit_event()` on `AbstractStore` |
| dm-audit-f2 | MemoryStore Audit Implementation | In-process append-only list; real `get_audit()` reading from it |
| dm-audit-f3 | CosmosStore Audit Implementation | Separate `audit_events` Cosmos container; TTL configurable |
| dm-audit-f4 | Write Hooks (upsert + soft_delete) | Both stores capture `old_value` and fire audit event before overwriting |
| dm-audit-f5 | API Surface | Filtered `GET /model/admin/audit` + new `GET /model/{layer}/{id}/history` |

---

## User Stories

### Feature dm-audit-f1 — Audit Event Schema & Abstract Contract

---

**DM-AUDIT-WI-01 — AuditEvent model + AbstractStore contract**  
*Points: 1*

**As a** model API consumer,  
**I want** a typed `AuditEvent` schema that every store implementation must produce,  
**so that** audit consumers have a stable contract regardless of store backend.

**Acceptance criteria:**
- `api/models/audit_event.py` defines `AuditEvent` (Pydantic):
  - `event_id: str` — UUID4
  - `layer: str`
  - `obj_id: str`
  - `operation: Literal["CREATE", "UPDATE", "SOFT_DELETE", "RESTORE"]`
  - `row_version: int` — version AFTER the change
  - `actor: str`
  - `timestamp: str` — UTC ISO
  - `correlation_id: str` — UUID4; groups events from one request/seed call
  - `old_value: dict | None` — full object snapshot before change (None on CREATE)
  - `new_value: dict | None` — full object snapshot after change
  - `diff: dict[str, list]` — `{field: [old_val, new_val]}` for changed fields only
- `api/store/base.py` adds abstract methods:
  - `append_audit_event(event: AuditEvent) -> None`
  - `get_audit(limit: int, layer: str | None, obj_id: str | None) -> list[AuditEvent]`
- `validate-model.ps1` exits 0

---

**DM-AUDIT-WI-02 — Diff utility**  
*Points: 1*

**As a** developer,  
**I want** a pure function `compute_diff(old, new) -> dict[str, list]` that returns
only the fields that changed,  
**so that** the audit event carries a human-readable field-level delta without duplicating
the full snapshots in every query.

**Acceptance criteria:**
- `api/utils/diff.py` exports `compute_diff(old: dict | None, new: dict) -> dict[str, list]`
- On CREATE (`old=None`): returns `{}` (no diff — new_value snapshot is sufficient)
- On UPDATE: returns `{field: [old_val, new_val]}` for every key whose value changed
- Internal store fields (`layer`, `obj_id`, `modified_at`, `modified_by`, `row_version`)
  are excluded from the diff (infrastructure noise, not business logic)
- Unit tests in `tests/test_audit_diff.py` (≥8 cases: create, update partial, update all,
  soft_delete, nested value change, list value change, no-op re-PUT, type change)

---

### Feature dm-audit-f2 — MemoryStore Audit Implementation

---

**DM-AUDIT-WI-03 — MemoryStore append-only audit log**  
*Points: 1*

**As a** developer running locally without Cosmos,  
**I want** MemoryStore to maintain a real append-only list of audit events,  
**so that** the full change history survives object overwrites and soft-deletes
for the lifetime of the process.

**Acceptance criteria:**
- `MemoryStore.__init__` adds `self._audit: list[AuditEvent] = []`
- `append_audit_event()` appends to `self._audit` under the existing `asyncio.Lock`
- `get_audit(limit, layer=None, obj_id=None)` filters `self._audit` by `layer`/`obj_id`
  if provided, sorts by `timestamp` DESC, returns top `limit`
- Old `get_audit()` projection-of-state implementation is removed
- Existing `GET /model/admin/audit` still works; response shape unchanged

---

### Feature dm-audit-f3 — CosmosStore Audit Implementation

---

**DM-AUDIT-WI-04 — CosmosStore audit_events container**  
*Points: 2*

**As a** production operator,  
**I want** audit events stored in a dedicated Cosmos container separate from live objects,  
**so that** the audit log is never overwritten by object upserts or re-seeds.

**Acceptance criteria:**
- `CosmosStore.init()` creates `audit_events` container if not exists:
  - Partition key: `/layer`
  - Default TTL: configurable via `Settings.audit_ttl_days` (default: 365, -1 = infinite)
  - Composite index: `[layer ASC, timestamp DESC]`, `[layer ASC, obj_id ASC, timestamp DESC]`
- `append_audit_event()` calls `container.create_item(event.model_dump())`
- `get_audit(limit, layer, obj_id)` queries `audit_events` with parameterised Cosmos SQL:
  - Base: `SELECT * FROM c WHERE c.layer = @layer ORDER BY c.timestamp DESC OFFSET 0 LIMIT @limit`
  - `+ AND c.obj_id = @obj_id` when `obj_id` supplied
  - Cross-partition query enabled when `layer=None`
- `Settings` gains `audit_container_name: str = "audit_events"` and `audit_ttl_days: int = 365`
- **⚠️ DB name accuracy note (2026-02-22):** `infrastructure.json` entry `cosmos-database` has `azure_resource_name: "eva-db"` — the actual sandbox DB name is `"eva-foundation"` (confirmed from `33-eva-brain-v2/.env.ado` `COSMOS_DATABASE=eva-foundation`). Ensure `COSMOS_DATABASE` env var used by this WI matches the real DB name. See dm-cat-f7 WI-12 for the model accuracy fix.

---

### Feature dm-audit-f4 — Write Hooks

---

**DM-AUDIT-WI-05 — upsert() fires audit events**  
*Points: 2*

**As an** auditor,  
**I want** every `PUT /model/{layer}/{id}` to produce an immutable audit event
with `old_value` and `new_value` snapshots before the object is overwritten,  
**so that** I can reconstruct any past state of any object.

**Acceptance criteria:**
- Both `MemoryStore.upsert()` and `CosmosStore.upsert()` are updated:
  1. Capture `old_value = deepcopy(existing)` before any mutation
  2. Determine `operation = "CREATE"` if no existing, else `"UPDATE"`
  3. Compute `diff = compute_diff(old_value, new_doc_after_audit_fields_set)`
  4. Build `AuditEvent` with `event_id=uuid4()`, correct `correlation_id` (caller-supplied or new uuid4)
  5. Call `await self.append_audit_event(event)` after the item is stored
- `correlation_id` is threaded through from the router layer via an optional parameter
  (default: generates new UUID4 so existing callers are unaffected)
- No change to the `PUT` response body shape

---

**DM-AUDIT-WI-06 — soft_delete() fires audit events**  
*Points: 1*

**As an** auditor,  
**I want** soft-deletes to appear in the audit log as `SOFT_DELETE` events,  
**so that** I can tell the difference between "this object was edited" and
"this object was removed."

**Acceptance criteria:**
- Both `MemoryStore.soft_delete()` and `CosmosStore.soft_delete()` append a
  `SOFT_DELETE` audit event with `old_value` = object before deletion,
  `new_value` = object after (`is_active=False`)
- `diff` contains at minimum `{"is_active": [true, false]}`

---

**DM-AUDIT-WI-07 — seed uses shared correlation_id**  
*Points: 1*

**As an** operator running `POST /model/admin/seed`,  
**I want** all audit events from a single seed call to share one `correlation_id`,  
**so that** I can see the full scope of a re-seed in one audit query instead of
300 unrelated CREATE events.

**Acceptance criteria:**
- `admin.seed()` generates one `correlation_id = str(uuid4())` before the loop
- Passes it as `correlation_id` to every `store.upsert()` call in that seed run
- `GET /model/admin/audit?correlation_id=<uuid>` returns all events from that seed
  (requires `correlation_id` filter added to `get_audit()` signature)

---

### Feature dm-audit-f5 — API Surface

---

**DM-AUDIT-WI-08 — Filtered GET /model/admin/audit**  
*Points: 1*

**As an** auditor,  
**I want** to filter the audit log by `layer`, `obj_id`, `actor`, and `correlation_id`,  
**so that** I can answer targeted questions without scanning the entire log.

**Acceptance criteria:**
- `GET /model/admin/audit` gains optional query params:
  - `layer: str | None`
  - `obj_id: str | None`
  - `actor: str | None`
  - `correlation_id: str | None`
  - `operation: str | None`
  - `limit: int = 50` (already exists)
- All filters are AND-combined
- Response is `list[AuditEvent]` (typed, not raw dicts)
- Existing callers with no query params see identical behaviour

---

**DM-AUDIT-WI-09 — GET /model/{layer}/{id}/history**  
*Points: 1*

**As a** developer or auditor,  
**I want** a single endpoint that returns the full change history for one object,  
**so that** I can answer "show me every version of `personas::admin` ever stored."

**Acceptance criteria:**
- Route: `GET /model/{layer}/{id}/history?limit=50`
- Delegates to `store.get_audit(layer=layer, obj_id=obj_id, limit=limit)`
- Returns events sorted `timestamp DESC`
- `row_version` values form a monotonic sequence (1, 2, 3…) when sorted ASC
- Returns `[]` (not 404) for an object that exists but has no audit events
  (covers pre-enhancement objects that pre-date the audit log)
- Registered in `base_layer.make_layer_router()` so all 19 layers get it for free

---

**DM-AUDIT-WI-10 — Rollback helper endpoint**  
*Points: 2*

**As an** operator,  
**I want** to restore an object to a prior `row_version` via the API,  
**so that** accidental changes can be undone without editing JSON files directly.

**Acceptance criteria:**
- Route: `POST /model/{layer}/{id}/rollback?to_version=<n>`
  (admin-only — requires `Authorization: Bearer <admin_token>`)
- Fetches `GET .../history`, finds the event where `row_version == to_version`,
  extracts `new_value` from that event
- Calls `store.upsert(layer, obj_id, new_value, actor)` with
  `operation` note in the resulting audit event: `"RESTORE"` with
  `diff` showing delta from current to the restored version
- Returns the restored object
- If `to_version` not found in history: `404` with clear message

---

## ADO Item Summary

| Type | ID | Title | Sprint | Points |
|------|----|-------|--------|--------|
| Epic | TBD | EVA Data Model — Real Audit Trail | — | — |
| Feature | TBD | dm-audit-f1: Audit Event Schema & Abstract Contract | — | — |
| Feature | TBD | dm-audit-f2: MemoryStore Audit Implementation | — | — |
| Feature | TBD | dm-audit-f3: CosmosStore Audit Implementation | — | — |
| Feature | TBD | dm-audit-f4: Write Hooks | — | — |
| Feature | TBD | dm-audit-f5: API Surface | — | — |
| WI | TBD | DM-AUDIT-WI-01: AuditEvent model + AbstractStore contract | Sprint-9 | 1 |
| WI | TBD | DM-AUDIT-WI-02: compute_diff utility + tests | Sprint-9 | 1 |
| WI | TBD | DM-AUDIT-WI-03: MemoryStore append-only audit log | Sprint-9 | 1 |
| WI | TBD | DM-AUDIT-WI-04: CosmosStore audit_events container | Sprint-9 | 2 |
| WI | TBD | DM-AUDIT-WI-05: upsert() fires audit events | Sprint-9 | 2 |
| WI | TBD | DM-AUDIT-WI-06: soft_delete() fires audit events | Sprint-9 | 1 |
| WI | TBD | DM-AUDIT-WI-07: seed uses shared correlation_id | Sprint-9 | 1 |
| WI | TBD | DM-AUDIT-WI-08: Filtered GET /model/admin/audit | Sprint-10 | 1 |
| WI | TBD | DM-AUDIT-WI-09: GET /model/{layer}/{id}/history | Sprint-10 | 1 |
| WI | TBD | DM-AUDIT-WI-10: POST /model/{layer}/{id}/rollback | Sprint-10 | 2 |

**Sprint-9 total:** 9 points (schema + both store implementations + write hooks)  
**Sprint-10 total:** 4 points (API surface + rollback)

---

## Implementation Sequence (critical path)

```
WI-01 (contract) ──► WI-02 (diff util)
                          │
              ┌───────────┴──────────┐
           WI-03                  WI-04
      (MemoryStore)          (CosmosStore container)
              │                     │
           WI-05 (upsert hooks — both stores)
              │
           WI-06 (soft_delete hooks)
              │
           WI-07 (seed correlation_id)
              │
     ┌────────┴─────────┐
  WI-08             WI-09
(filtered audit)  (history endpoint)
                       │
                    WI-10
                  (rollback)
```

---

## Files to Create or Modify

| File | Action |
|------|--------|
| `api/models/audit_event.py` | CREATE — `AuditEvent` Pydantic model |
| `api/utils/diff.py` | CREATE — `compute_diff()` |
| `api/utils/__init__.py` | CREATE or UPDATE |
| `api/store/base.py` | MODIFY — add `append_audit_event()`, update `get_audit()` signature |
| `api/store/memory.py` | MODIFY — implement new audit methods, remove projection-of-state |
| `api/store/cosmos.py` | MODIFY — add `audit_events` container, implement audit methods |
| `api/routers/admin.py` | MODIFY — filtered audit endpoint, seed correlation_id |
| `api/routers/base_layer.py` | MODIFY — add `/history` and `/rollback` routes |
| `api/config.py` | MODIFY — `audit_container_name`, `audit_ttl_days` settings |
| `tests/test_audit_diff.py` | CREATE — ≥8 unit tests for `compute_diff` |
| `tests/test_audit_trail.py` | CREATE — integration tests for full write → audit → history flow |
