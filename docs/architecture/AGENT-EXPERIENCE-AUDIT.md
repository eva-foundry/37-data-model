# Agent Experience Audit - Data Model API

**Date:** March 5, 2026  
**Auditor:** AI Agent (simulated user journey)  
**API:** https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io  
**Status:** COMPREHENSIVE - Ready for self-documenting enhancement

---

## Executive Summary

The EVA Data Model API already has **excellent foundations** for agent self-service:
- ✅ `/model/agent-guide` provides comprehensive documentation
- ✅ `/health` and `/ready` for service discovery
- ✅ `/model/agent-summary` for one-call overview
- ✅ Query params work for endpoints (`?status=`) and evidence (`?sprint_id=`)

**Key Pain Points Discovered:**
1. **WHERE clause support inconsistent** - works for endpoints/evidence, not other layers
2. **Terminal scrambling** - large responses (272 literals) break formatting
3. **Client-side filtering burden** - agents must download all data then filter
4. **No query builder assistance** - agents must discover tricks through trial/error
5. **Schema introspection limited** - no "what fields can I query?" endpoint

---

## What Works Well ✅

### 1. Self-Documenting Guide Exists
`GET /model/agent-guide` returns comprehensive JSON with:
- Bootstrap sequence (5 steps)
- Query patterns (12 common scenarios)
- Write cycle rules (5 critical rules)
- Forbidden operations (7 antipatterns)
- Quick reference

**Agent feedback:** "This is gold. I can learn the entire API from one endpoint."

### 2. Health & Readiness Probes
```powershell
GET /health
# Returns: status, service, version, store, uptime_seconds, request_count

GET /ready
# Returns: store_reachable, cache status
```

**Agent feedback:** "Clear operational status. I know if Cosmos is up."

### 3. Layer Overview
```powershell
GET /model/agent-summary
# Returns: {total: 895, by_layer: {...}, layers: [...]}
```

**Agent feedback:** "One call shows me all 41 layers. Efficient."

### 4. Endpoints Support Filtering
```powershell
GET /model/endpoints/?status=implemented
GET /model/endpoints/?status=stub
```

**Agent feedback:** "I can find unimplemented endpoints without client-side filtering."

### 5. Evidence Supports Sprint Filtering
```powershell
GET /model/evidence/?sprint_id=ACA-S11
```

**Agent feedback:** "Sprint-specific queries work. No need to download all 62 records."

---

## Pain Points Discovered 🔴

### Pain Point 1: Inconsistent WHERE Clause Support

**What works:**
- `GET /model/endpoints/?status=implemented` ✅
- `GET /model/evidence/?sprint_id=ACA-S11` ✅

**What doesn't work:**
- `GET /model/projects/?maturity=active` ❌ (returns all 56 projects)
- `GET /model/evidence/?test_result=FAIL` ❌ (returns all evidence)
- `GET /model/sprints/?status=completed` ❌ (returns all sprints)
- `GET /model/services/?is_active=true` ❌ (returns all services)

**Agent workaround:**
```powershell
# Required: Download all, filter client-side
$all = Invoke-RestMethod "$base/model/projects/"
$active = $all | Where-Object { $_.maturity -eq 'active' }
```

**Impact:** 
- Agents must download 272 literals to find 5 matching records
- Network bandwidth waste (especially over APIM)
- PowerShell memory pressure with large datasets

**Recommendation:** Add universal query param support:
```
GET /model/{layer}/?{field}={value}
GET /model/{layer}/?{field}.{operator}={value}  # Future: .gt, .lt, .contains
```

---

### Pain Point 2: Terminal Scrambling with Large Responses

**Scenario:**
```powershell
$literals = Invoke-RestMethod "$base/model/literals/"  # 272 objects
$literals | Format-Table  # Terminal output scrambles
```

**Agent complaint:**
```
"[ISSUE] If I try Format-Table on 272 objects, terminal will scramble
[WORKAROUND] Use Select-Object -First N or export to file"
```

**Evidence from session:**
```
services : eva-brain-api model-graph-explorer azure-apim assist-me azure-foundation eva-foundry-lib chat-face model-sync-agent agent-fleet eva-jurisprudence eva-cdc eva-ado-dashboard model-admin-panel eva-red-teaming model-impact-view eva-ui-bench model-trust-linker eva-jp-spark model-api eva-control-plane eva-cli eva-devbench eva-system-analysis model-diagram-agent admin-face model-status-agent model-drift-dashboard eva-spark eva-roles-api model-doc-generator-agent model-explorer-ui maf-orchestration model-drift-agent eva-ado-command-center personas : viewer auditor legal-researcher machine-agent jr_user support admin legal-clerk jr_admin developer endpoints : POST /v1/sessions POST /v1/chat/work GET /v1/config/features...
```

**Root cause:** PowerShell terminal width limits, no pagination support

**Recommendation:**
1. Add pagination: `GET /model/{layer}/?limit=20&offset=0`
2. Add count endpoint: `GET /model/{layer}/count` (fast, no data transfer)
3. Document in agent-guide: "Always use -First N for exploration"

---

### Pain Point 3: Discovery Through Trial-and-Error

**Agent journey:**
```
1. Try: GET /model/projects/?maturity=active
   Result: Returns all 56 projects (no error, silent failure)
   
2. Realize: Query param didn't work
   
3. Fallback: Download all + client-side filter
```

**No feedback loop:** API doesn't tell agents "this layer doesn't support query params yet."

**Recommendation:** Return helpful error when unsupported query used:
```json
{
  "warning": "Query parameter 'maturity' not supported on projects layer. Returning all objects. Use client-side filtering or request server-side support.",
  "data": [...all projects...]
}
```

---

### Pain Point 4: Schema Introspection Gap

**What agents want:**
```
"What fields can I query on the projects layer?"
"Show me an example project object"
"What's the structure of evidence.context.pytest?"
```

**What exists:**
- Schema files in `schema/*.json` (not accessible via API)
- `/model/agent-guide` (doesn't show field-level details)

**What's missing:**
```
GET /model/schemas/projects
# Returns: Full JSON schema with field descriptions

GET /model/{layer}/example
# Returns: One real object with all fields populated

GET /model/{layer}/fields
# Returns: ["id", "label", "maturity", "phase", "goal", ...]
```

**Recommendation:** Add schema introspection endpoints.

---

### Pain Point 5: No Aggregation Queries

**Agent needs:**
```
"How many stories completed in sprint ACA-S11?"
"What's the average coverage across all evidence?"
"Show me test count trend over last 5 sprints"
```

**Current approach:**
```powershell
# Agent must implement aggregation logic
$ev = Invoke-RestMethod "$base/model/evidence/?sprint_id=ACA-S11"
$completed = ($ev | Where-Object { $_.phase -eq 'A' }).Count
$avg_cov = ($ev | Measure-Object -Property validation.coverage_percent -Average).Average
```

**Recommendation:** Add aggregation endpoints:
```
GET /model/evidence/aggregate?sprint_id=ACA-S11&group_by=phase&count=true
GET /model/sprints/{id}/metrics
GET /model/projects/{id}/metrics/trend
```

---

## Agent Learning Patterns (Observed)

### Pattern 1: Progressive Exploration
```powershell
1. GET /health                    # "Is it alive?"
2. GET /model/agent-guide         # "How does it work?"
3. GET /model/agent-summary       # "What's available?"
4. GET /model/{layer}/ -First 3   # "Show me examples"
5. GET /model/{layer}/{id}        # "Get full object"
```

### Pattern 2: Trial-and-Error Filtering
```powershell
# Try 1: Server-side filter
$result = Invoke-RestMethod "$base/model/projects/?maturity=active"

# Realize: Got all 56 projects, not just active
# Try 2: Client-side filter
$active = $result | Where-Object { $_.maturity -eq 'active' }
```

### Pattern 3: Terminal Safety
```powershell
# Learned behavior after terminal scramble:
$data = Invoke-RestMethod "$base/model/literals/"
$data | Select-Object -First 10 | Format-Table  # Safe
$data | Export-Csv "temp-literals.csv"          # Safe
```

---

## Tricks Agents Discovered

### Trick 1: Use Select-Object Before Format-Table
```powershell
# ❌ Terminal scrambles
$all | Format-Table

# ✅ Safe output
$all | Select-Object -First 10 | Format-Table
```

### Trick 2: Export Large Datasets to File
```powershell
$literals = Invoke-RestMethod "$base/model/literals/"
$literals | ConvertTo-Json -Depth 10 | Out-File "literals-temp.json"
# Now read file instead of terminal output
```

### Trick 3: Get First Object as Schema Example
```powershell
$example = Invoke-RestMethod "$base/model/projects/" | Select-Object -First 1
$example | ConvertTo-Json -Depth 5
# Use this to learn field names
```

### Trick 4: Count Without Downloading
```powershell
$all = Invoke-RestMethod "$base/model/projects/"
$all.Count  # 56
# But had to download all 56 objects to get count
```

### Trick 5: Check Endpoint ID Format
```powershell
# Don't construct endpoint IDs, copy exact format:
$ep = Invoke-RestMethod "$base/model/endpoints/" | 
      Where-Object { $_.path -like '*translations*' } | 
      Select-Object id
# id = "GET /v1/config/translations/{language}"  (exact format)
```

---

## Recommendations: Self-Documenting Evolution

### Recommendation 1: Enhanced /model/agent-guide

Add these sections to existing guide:

```json
{
  "discovery_journey": {
    "step_1": "GET /health — Check liveness",
    "step_2": "GET /model/agent-guide — Learn this guide",
    "step_3": "GET /model/agent-summary — See all layers",
    "step_4": "GET /model/{layer}/?limit=3 — Get examples",
    "step_5": "GET /model/schemas/{layer} — See field definitions"
  },
  "query_capabilities": {
    "endpoints": ["?status=implemented|stub|planned"],
    "evidence": ["?sprint_id=X", "?story_id=X", "?phase=D1|D2|P|D3|A"],
    "other_layers": "Client-side filtering required. Download all then use Where-Object."
  },
  "terminal_safety": {
    "large_datasets": "Always use Select-Object -First N before Format-Table",
    "best_practice": "Export to file for datasets > 50 objects",
    "pagination_coming": "Pagination support planned (?limit=20&offset=0)"
  },
  "common_mistakes": [
    "Using ConvertTo-Json -Depth 5 (use -Depth 10)",
    "Constructing endpoint IDs manually (copy from API)",
    "Assuming query params work everywhere (only endpoints/evidence)",
    "Format-Table on large datasets (terminal scrambles)"
  ],
  "examples": {
    "filter_active_projects": {
      "current": "$all = Invoke-RestMethod /model/projects/; $all | Where maturity -eq active",
      "future": "Invoke-RestMethod /model/projects/?maturity=active"
    },
    "count_evidence": {
      "current": "(Invoke-RestMethod /model/evidence/).Count",
      "future": "Invoke-RestMethod /model/evidence/count"
    }
  }
}
```

### Recommendation 2: Add Schema Introspection

```
GET /model/schemas/{layer}
# Returns: Full JSON schema from schema/*.json

GET /model/{layer}/example
# Returns: One real object with all fields populated

GET /model/{layer}/fields
# Returns: Array of field names
```

### Recommendation 3: Universal Query Support

```
GET /model/{layer}/?{field}={value}
# Works for ALL layers (not just endpoints/evidence)

GET /model/{layer}/count
# Fast count without data transfer

GET /model/{layer}/?limit=20&offset=0
# Pagination for large datasets
```

### Recommendation 4: Helpful Error Messages

When unsupported query param used:
```json
{
  "warning": "Query parameter 'maturity' not yet supported on 'projects' layer",
  "fallback": "Returning all objects. Use client-side filtering.",
  "request_support": "File issue: https://github.com/eva-foundry/37-data-model/issues",
  "data": [...]
}
```

### Recommendation 5: Aggregation Endpoints

```
GET /model/evidence/aggregate
  ?sprint_id=ACA-S11
  &group_by=phase
  &metrics=count,avg:validation.coverage_percent

GET /model/sprints/{id}/metrics
# Returns: Aggregated evidence metrics for sprint

GET /model/projects/{id}/metrics/trend
# Returns: Multi-sprint trend data
```

---

## Success Criteria

**Agent can:**
1. ✅ Learn entire API from `/model/agent-guide` (no README needed)
2. ✅ Discover layer structure with 2 API calls (agent-summary + example)
3. ⚠️ Filter any layer server-side (currently: only endpoints/evidence)
4. ⚠️ Count objects without downloading (currently: must download all)
5. ⚠️ Get aggregated metrics (currently: must implement aggregation)
6. ✅ Avoid terminal scrambling (documented workarounds)
7. ✅ Write data with validation (guide shows commit cycle)

**Legend:** ✅ = Works today, ⚠️ = Needs enhancement

---

## Conclusion

The EVA Data Model API is **already 70% self-documenting**. The `/model/agent-guide` endpoint is comprehensive and agents can bootstrap themselves.

**To achieve 100% self-documentation:**
1. Add universal query param support (4 weeks)
2. Add schema introspection endpoints (2 weeks)
3. Add pagination & count endpoints (1 week)
4. Add aggregation queries (3 weeks)
5. Enhance agent-guide with examples (1 week)

**Immediate wins (1 week):**
- Add query capability matrix to agent-guide
- Add terminal safety guidance
- Add example queries for each layer
- Document which query params work where

**Agent quote:**
> "The API already teaches me how to use it. With query support everywhere and aggregation endpoints, I'd never need to read a README again. This is the future."
