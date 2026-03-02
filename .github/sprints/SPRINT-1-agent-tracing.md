# SPRINT-1: Agent Execution Tracing & Correlation IDs

**Epic**: FK-ENHANCEMENT  
**Sprint ID**: SPRINT-1  
**Type**: Infrastructure  
**Duration**: 2 sprints (ongoing)  
**Status**: PLANNING  

---

## Overview

Implement **end-to-end agent execution tracing** to close the LLM observability gap discovered in SPRINT-0.5. Every agent action should be traceable from:
- **Input source** (GitHub issue, data model, literal config)
- **LLM call** (model, tokens, cost, latency)
- **Transformation** (processing logic)
- **Output destination** (PR, data model, artifact)

---

## Business Context

**Problem (from SPRINT-0.5 post-mortem)**:
- LLM prompts and responses are lost after processing
- Token usage shown as 0 (not actually tracked)
- No cost visibility (which models actually used?)
- RCA on agent bugs requires code reading (no logs)
- Cannot audit "why did the agent choose this fix?"

**Solution**:
- Unified correlation ID across entire sprint execution
- Capture all LLM interactions (prompt, response, tokens, cost)
- Link to WBS/Epic/Feature hierarchy
- Centralized `.eva/traces/` directory (queryable in data model)

---

## Stories

### F37-TRACE-001: Correlation ID Infrastructure
**Type**: Story  
**Size**: S (3 FP)  
**Acceptance Criteria**:
- [ ] `correlation_id` generated at sprint start (format: `SPRINT-{id}-{timestamp}-{uuid[:8]}`)
- [ ] Passed to all child processes (bug_fix_agent, etc.)
- [ ] Included in all log messages `[TRACE:{correlation_id}]`
- [ ] Stored in every artifact JSON (`.eva/traces/`, `.eva/evidence/`)
- [ ] Queryable in data model: `GET /model/sprints/{sprint_id}?correlation_id={id}`

**Files to Create/Modify**:
- `.github/scripts/sprint_agent.py` (lines 820-850: add correlation ID generation)
- `.github/scripts/bug_fix_agent.py` (lines 1-50: accept and propagate)
- `.eva/trace-schema.json` (new: JSON schema for trace records)

---

### F37-TRACE-002: LLM Interaction Logging
**Type**: Story  
**Size**: M (5 FP)  
**Acceptance Criteria**:
- [ ] All LLM calls logged to `.eva/traces/{story_id}-{phase}-lm-calls.json`
- [ ] Capture: timestamp, model, tokens_in, tokens_out, cost_usd, latency_ms, prompt_hash, response_hash
- [ ] Support model selection logic: free (gpt-4o-mini) vs paid (gpt-4o) vs custom (Claude via Foundry)
- [ ] Cost calculation: `(tokens_in * input_multiplier + tokens_out * output_multiplier) * $0.00001`
- [ ] Aggregate cost per sprint in summary

**Model Configuration** (hardcoded, data model-queryable):
```python
LLM_MODELS = {
    "gpt-4o-mini": {
        "tier": "free",
        "input_multiplier": 0.015,
        "output_multiplier": 0.0075,
        "use_for": ["95% of bugs: Phase A (RCA), Phase B (fix), Phase C (test)"]
    },
    "gpt-4o": {
        "tier": "free-limited",
        "input_multiplier": 0.25,
        "output_multiplier": 0.125,
        "use_for": ["Critical bugs, RCA expert role, refactoring decisions"]
    },
    "claude-3.5-haiku": {
        "tier": "foundry-paid",
        "input_multiplier": 0.08,  # Placeholder
        "output_multiplier": 0.04,
        "use_for": ["If user brings Foundry model", "Not in GitHub Models free tier"]
    }
}
```

**Files to Create/Modify**:
- `.github/scripts/bug_fix_agent.py` (new class: `LMTracer`)
- `.eva/trace-schema.json` (lm-calls section)

---

### F37-TRACE-003: Data Model Query Integration
**Type**: Story  
**Size**: S (3 FP)  
**Acceptance Criteria**:
- [ ] Extend sprint.schema.json with `traces` field (array of trace object IDs)
- [ ] Extend wbs.schema.json with `trace_id` field (FK to traces layer)
- [ ] `PUT /model/traces/{correlation_id}` endpoint stores full trace record
- [ ] `GET /model/traces/{correlation_id}?depth=3` returns trace + linked stories
- [ ] `GET /model/sprints/{sprint_id}/traces` lists all traces for sprint

**Files to Create/Modify**:
- `schema/sprint.schema.json` (add `traces` field)
- `schema/wbs.schema.json` (add `trace_id` field)
- `schema/traces.schema.json` (new: define trace layer)
- `routers/traces.py` (new: HTTP endpoints)

---

### F37-TRACE-004: Artifact Enrichment (WBS Hierarchy Metadata)
**Type**: Story  
**Size**: M (5 FP)  
**Acceptance Criteria**:
- [ ] All evidence receipts include: `epic_id`, `feature_id`, `story_id`, `trace_id`, `correlation_id`
- [ ] Timestamp every state transition: created, submitted_to_lm, response_received, fix_applied, test_passed, committed
- [ ] `.eva/evidence/{story_id}-{phase}-receipt.json` follows unified schema
- [ ] Evidence queryable: `GET /model/evidence/{story_id}` returns hierarchy
- [ ] Sprint summary shows: cost breakdown by story/model/phase

**Example Enhanced Receipt**:
```json
{
  "correlation_id": "SPRINT-0.5-20260301-a1b2c3d4",
  "story_id": "BUG-F37-001",
  "epic_id": "FK-ENHANCEMENT",
  "feature_id": "F37-DPDCA-001",
  "phase": "A",
  "phase_name": "Discover RCA",
  
  "timeline": {
    "created_at": "2026-03-01T16:57:04.123Z",
    "submitted_to_lm_at": "2026-03-01T16:57:05.456Z",
    "response_received_at": "2026-03-01T16:57:06.789Z",
    "fix_applied_at": "2026-03-01T16:57:07.012Z",
    "test_passed_at": "2026-03-01T16:57:08.345Z",
    "committed_at": "2026-03-01T16:57:09.678Z"
  },
  
  "lm_interaction": {
    "model": "gpt-4o-mini",
    "model_tier": "free",
    "tokens_in": 245,
    "tokens_out": 89,
    "cost_usd": 0.00029,
    "latency_ms": 850,
    "prompt_hash": "sha256:abc123...",
    "response_hash": "sha256:def456..."
  },
  
  "status": "DONE",
  "test_result": "PASS",
  "files_changed": 0,
  "commit_sha": "a110cb6..."
}
```

**Files to Create/Modify**:
- `.github/scripts/sprint_agent.py` (lines 630-680: write_evidence)
- `.eva/evidence-schema.json` (new: define unified schema)

---

### F37-TRACE-005: Cost Analysis & Model Selection
**Type**: Story  
**Size**: M (5 FP)  
**Acceptance Criteria**:
- [ ] Sprint summary includes cost breakdown (by model, by phase, by story)
- [ ] Comparison: projected cost if run with gpt-4o (paid) vs gpt-4o-mini (free)
- [ ] Model selection logic: if story.severity == CRITICAL, route to gpt-4o; else gpt-4o-mini
- [ ] Cost tracking per GitHub token budget (Copilot Enterprise: 900 requests/day, 600K tokens/day)
- [ ] Alert if sprint would exceed free tier limits

**Example Summary Section**:
```markdown
### Cost Analysis

| Model | Tier | Count | Tokens (in/out) | Cost |
|-------|------|-------|-----------------|------|
| gpt-4o-mini | Free | 9 | 2112/894 | $0.00261 |
| gpt-4o (if paid) | Paid | 0 | - | $0.00 |
| **Total** | | | | **$0.00261** |

**Free Tier Status**: 6,149 requests/day remaining (6,150 limit)
**Projected Monthly**: $0.261 (within free tier for 100 sprints/month)
```

**Files to Create/Modify**:
- `.github/scripts/sprint_agent.py` (lines 1020-1080: sprint_summary)
- `.eva/cost-analysis.json` (new: detailed breakdown)

---

## Implementation Approach

### Phase 1: Correlation ID + Basic Logging (SPRINT-1, Week 1)
1. Generate correlation ID at sprint start
2. Pass to child processes
3. Log all messages with `[TRACE:{id}]`
4. Store in all JSON artifacts

### Phase 2: LLM Call Capture (SPRINT-1, Week 2)
1. Wrap all LLM calls with `LMTracer`
2. Capture prompt, response, tokens, cost
3. Write to `.eva/traces/{story_id}-{phase}-lm-calls.json`

### Phase 3: Data Model Integration (SPRINT-2, Week 1)
1. Extend schema with traces layer
2. Create `/model/traces/` endpoints
3. Link traces to sprints/stories

### Phase 4: Cost Analysis (SPRINT-2, Week 2)
1. Aggregate costs per sprint
2. Show model distribution
3. Alert on free tier exhaustion

---

## Testing

- [ ] SPRINT-0.5 rerun: verify all 3 bugs produce traces
- [ ] Trace retrieval: `GET /model/sprints/SPRINT-0.5/traces` returns 9 trace records
- [ ] Cost calculation: verify $0.00261 matches manual calculation
- [ ] Evidence schema: validate all receipts conform to schema

---

## Success Criteria

- ✅ Every agent action has `correlation_id` in logs
- ✅ Every LLM call captured (model, tokens, cost, latency)
- ✅ Sprint summary shows cost breakdown (actual + simulated payit)
- ✅ Traces queryable via data model API
- ✅ RCA on agent failures possible without code reading
