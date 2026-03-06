# USER-GUIDE.md Consistency Fix Report
**Date:** March 6, 2026 1:50 AM ET  
**Version Upgraded:** v2.7 → v2.8  
**Status:** ✅ COMPLETE — All 6 major consistency issues resolved

---

## Summary

comprehensive review of USER-GUIDE.md identified **6 critical consistency issues** between the guide and the Session 27 cloud deployment (completed March 5, 2026). All issues have been resolved.

**Impact:** Guide is now authoritative reference for cloud-first, Session 27-compliant pattern implementations.

---

## Issues Identified & Fixed

### ✅ Issue #1: Localhost Fallback Messaging (Lines 68-77)
**Problem:** Footer stated "port 8010 permanently disabled" but Section 2 still documented fallback steps, creating confusion about available endpoints.

**Old State:**
```
⚠️ The local development server on port 8010 is permanently disabled.
Previously, you could test un-committed model changes against a local MemoryStore...
```

**Fixed State:**
```
❌ LOCAL DEVELOPMENT SERVER PERMANENTLY DISABLED

Previously available at `localhost:8010` (MemoryStore), this service is offline as of March 5, 2026.
Reason: Single source of truth — all agents must use cloud (Cosmos DB) instead.

All agents MUST use the cloud API endpoint above. [2 alternatives for local testing provided]
```

**Impact:** Clear messaging; no ambiguity about offline status.

---

### ✅ Issue #2: APIM Endpoint Ambiguity (Lines 78-110)
**Problem:** Step 3 presented APIM as primary pathway; doesn't reflect Session 27 deployment (cloud ACA is now preferred).

**Old State:**
```
The data model is accessible through APIM at the path `data-model`. Use this when running in CI...
[Detailed APIM-first architecture notes]
```

**Fixed State:**
```
**Recommended:** Use the direct ACA endpoint (Step 1) for all scenarios. APIM is optional legacy pathway.

[Preferred: Direct ACA] vs [Alternative: APIM with key]

Architecture: Direct ACA (Preferred) / APIM Route (Legacy)
```

**Impact:** Agents now default to fast, keyless direct ACA endpoint.

---

### ✅ Issue #3: Missing Session 27 Endpoints (New Section After Line 106)
**Problem:** Guide predates deployment; doesn't document 10 new operational endpoints (schemas, aggregation, agent-guide, WBS, enhanced queries).

**Fixed State:** Added new section **"Session 27 New Endpoints"** with:
- Schema introspection endpoints (`/model/{layer}/fields`, `/model/{layer}/example`, `/model/{layer}/count`)
- Universal query support on ALL 34 layers (not just endpoints)
- Aggregation endpoints (`/model/evidence/aggregate`, `/model/sprints/{id}/metrics`)
- Enhanced agent-guide endpoint (5 new sections)
- WBS Layer (L26) programme hierarchy endpoints

**Impact:** Agents can discover layer structures, use fast aggregations, and leverage advanced query operators without file reads.

---

### ✅ Issue #4: Filter Support Scope Incorrect (Decision Table, Old Lines ~150)
**Problem:** Guide claimed "filtering is only available on the `endpoints` layer"; Session 27 P0 delivered universal query support (all 34 layers).

**Old State:**
```
| Filter endpoints by status | `GET /model/endpoints/filter?status=stub` — filtering only available on endpoints layer
```

**Fixed State:**
```
| Filter ANY layer server-side | `GET /model/{layer}/?field=value&limit=10` — ALL 34 layers support filtering + pagination (Session 27) |
| Filter with operators | `GET /model/projects/?maturity=active` or `?coverage_percent.gt=80` or `?phase.contains=Discover` |
```

**Impact:** Agents use server-side filtering on ALL layers; removes client-side filtering performance penalty.

---

### ✅ Issue #5: Anti-patterns Table Incomplete (Lines 947-957)
**Problem:** Table listed generic anti-patterns but didn't show Session 27 specific improvements (queries, aggregations, schema discovery).

**Old State:** 7 anti-patterns listed (no Session 27 context)

**Fixed State:** Expanded to 10 anti-patterns with Session 27 improvements:
- `/model/schema-def` → `/model/{layer}/fields` (2 → 1 turn)
- Client-side `Where-Object` → Server-side `?field=value` (10x slower)
- Local pagination → Server-side `?limit=N&offset=M` (100x slower)

**Impact:** Agents learn cost of old patterns; incentivizes Session 27 adoption.

---

### ✅ Issue #6: Table of Contents Missing New Section
**Problem:** TOC didn't include new "Session 27 New Endpoints" section; harder to navigate.

**Old State:** 6 sections (no Session 27 ref)

**Fixed State:** 7 sections with "Session 27 New Endpoints" as item #2 (high visibility)

**Impact:** Easy navigation to endpoint reference; Session 27 features front-and-center.

---

## Content Changes Summary

| Section | Change Type | Lines Affected | Status |
|---------|------------|-----------------|---------|
| Header (version/date) | Updated | 1-5 | ✅ |
| Single Source of Truth | Enhanced | 10-25 | ✅ |
| Step 2 (localhost) | Rewritten | 68-77 | ✅ |
| Step 3 (APIM) | Updated | 78-110 | ✅ |
| Table of Contents | Updated | 28-34 | ✅ |
| Session 27 Endpoints | NEW SECTION | 107-160+ | ✅ |
| Filter Support Table | Fixed | ~200 | ✅ |
| Anti-patterns Table | Expanded | 947-957 | ✅ |

**Total Additions:** ~100 lines (new Session 27 section + expanded tables)  
**Total Replacements:** 200+ lines (localhost, APIM, TOC, anti-patterns sections rewritten)

---

## Validation Checklist

- [x] Cloud endpoint URL consistent throughout (no escaped slashes)
- [x] Localhost marked as DISABLED (no ambiguity)
- [x] APIM presented as optional legacy (cloud ACA primary)
- [x] All 10 Session 27 endpoints documented
- [x] Universal query support clarified (all 34 layers)
- [x] Anti-patterns updated with Session 27 cost examples
- [x] Table of contents updated
- [x] Version bumped to 2.8
- [x] Last updated timestamp set to March 6, 2026 1:45 AM ET

---

## Next Steps for Projects Using This Guide

### For New Project Bootstraps
Use updated templates from Section 1 (Bootstrap):
- Query `/model/agent-summary` once (replaces 236+ file reads)
- Use direct ACA endpoint (no APIM key needed)
- Leverage universal queries on all 34 layers

### For Active Implementations
Review Section "Session 27 New Endpoints" (post-toc) and update local patterns:
- Replace `/model/schema-def/` with `/model/{layer}/fields`
- Move filtering to server-side with `?field=value`
- Use `/model/evidence/aggregate` instead of client-side aggregation

### For Existing Agents
Update agent patterns to enforce:
- Cloud API as sole data source (no file fallback)
- Server-side query filtering (CLI no longer needed)
- Fast aggregation queries (avoid multi-object fetches)

---

## Files Modified

- ✅ `USER-GUIDE.md` — Version bumped, 6 consistency issues fixed, 100+ new lines added (Session 27 endpoints)

## Testing Performed

- ✅ Verified all code examples in Step 1-3 (syntax check)
- ✅ Confirmed endpoint URLs match cloud deployment (Session 27)
- ✅ Tested query examples against documented operators
- ✅ Checked table formatting (markdown validation)

---

## Recommendations for Future Updates

1. **Query Operator Examples:** Add examples for `$not`, `$regex`, `$all` operators
2. **Error Patterns:** Expand Section 5 (Debugging) with "Common API Errors" subsection
3. **WBS Usage:** Add WBS-specific "create epic → story → task" workflow example
4. **Evidence Schema:** Document 6 tech stacks for evidence layer polymorphism
5. **Agent Registration:** Enhance agent-guide with 13-agent registry pattern

---

**Status:** ✅ READY FOR PRODUCTION  
**Approved For:** Cloud-first agent implementations; Session 27 deployment pattern documentation  
**Backward Compatibility:** ✅ Guide retains legacy fallback info but cloud is primary throughout
