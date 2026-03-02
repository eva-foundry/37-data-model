# SPRINT-1 Architecture Diagram

## High-Level Data Flow

```
GitHub Issue #3 [SPRINT-0.5]
         ↓
    sprint_agent.py
    ├─ Extract sprint_id: "SPRINT-0.5"
    ├─ Generate correlation_id: "SPRINT-0.5-20260301165702-a1b2c3d4"
    ├─ LOG: [TRACE:SPRINT-0.5-20260301165702-a1b2c3d4] [INFO] Sprint starting
    ├─ Parse manifest from data model: GET /model/sprints/SPRINT-0.5
    ├─ For each bug story:
    │   ├─ BUG-F37-001 (row_version)
    │   ├─ BUG-F37-002 (endpoint format)
    │   └─ BUG-F37-003 (missing module)
    │
    └─ SUBPROCESS CALL → bug_fix_agent.py
         │
         ├─ Phase A: RCA (Root Cause Analysis)
         │   ├─ LM Call (gpt-4o-mini)
         │   ├─ TRACE: [correlate_id] LM prompt="Why row_version 0?"
         │   ├─ LMTracer.call_lm(model="gpt-4o-mini", tokens_in=245, tokens_out=89)
         │   ├─ Cost = (245×0.015 + 89×0.0075) × $0.00001 = $0.00004
         │   └─ Save: .eva/traces/BUG-F37-001-A-lm-calls.json
         │
         ├─ Phase B: Generate Fix Code
         │   ├─ LM Call 2 (gpt-4o-mini)
         │   ├─ LMTracer.call_lm(model="gpt-4o-mini", tokens_in=312, tokens_out=156)
         │   ├─ Cost = (312×0.015 + 156×0.0075) × $0.00001 = $0.00005
         │   ├─ Write fixed code to file
         │   └─ Save: .eva/traces/BUG-F37-001-B-lm-calls.json
         │
         └─ Phase C: Prevention Test
             ├─ LM Call 3 (gpt-4o-mini)
             ├─ LMTracer.call_lm(model="gpt-4o-mini", tokens_in=198, tokens_out=67)
             ├─ Cost = (198×0.015 + 67×0.0075) × $0.00001 = $0.00003
             ├─ Run pytest: PASS
             └─ Save: .eva/traces/BUG-F37-001-C-lm-calls.json
                 (and write_evidence called here)
                   ↓
             Write evidence file:
             .eva/evidence/BUG-F37-001-receipt.json
             {
               "correlation_id": "SPRINT-0.5-20260301165702-a1b2c3d4",
               "story_id": "BUG-F37-001",
               "epic_id": "FK-DPDCA-001",
               "feature_id": "F37-DPDCA-001",
               "phase": "A/B/C (all 3)",
               "timeline": {
                 "created_at": "2026-03-01T16:57:02.123Z",
                 "submitted_to_lm_at": "2026-03-01T16:57:03.456Z",
                 "response_received_at": "2026-03-01T16:57:04.306Z",
                 "fix_applied_at": "2026-03-01T16:57:05.000Z",
                 "test_passed_at": "2026-03-01T16:57:08.200Z",
                 "committed_at": "2026-03-01T16:57:10.500Z"
               },
               "lm_interaction": {
                 "model": "gpt-4o-mini",
                 "tokens_in": 245,
                 "tokens_out": 89,
                 "cost_usd": 0.00004345,
                 "latency_ms": 850,
                 "prompt_hash": "sha256:abc123...",
                 "response_hash": "sha256:def456..."
               },
               "test_result": "PASS",
               "status": "DONE"
             }
                       ↓
     Repeat for BUG-F37-002, BUG-F37-003
                       ↓
     (9 LM calls, 9 trace files, 3 evidence files created)
                       ↓
     sprint_agent.py continues:
     ├─ Calculate total cost from all traces:
     │   BUG-F37-001 (3 phases): $0.00012
     │   BUG-F37-002 (3 phases): $0.00012
     │   BUG-F37-003 (3 phases): $0.00012
     │   ────────────────────────────────
     │   Total Sprint: $0.00036
     │
     ├─ Generate sprint summary with cost breakdown:
     │   | Model | Count | Cost |
     │   | gpt-4o-mini | 9 | $0.00036 |
     │   | gpt-4o | 0 | $0.00 |
     │   | **Total** | | **$0.00036** |
     │
     ├─ Update each WBS story in data model:
     │   PUT /model/wbs/BUG-F37-001
     │   PUT /model/wbs/BUG-F37-002
     │   PUT /model/wbs/BUG-F37-003
     │
     ├─ Save all traces to data model (Phase 2):
     │   PUT /model/traces/SPRINT-0.5-20260301165702-a1b2c3d4
     │
     ├─ Verify model consistency:
     │   POST /model/admin/commit
     │   Returns: status=PASS, violation_count=0
     │
     └─ Create GitHub PR with cost breakdown in description
         ├─ Title: feat(37-data-model): [SPRINT-0.5] Complete
         ├─ Cost Summary section
         ├─ 3/3 stories done
         └─ Link to all evidence files
```

---

## Correlation ID Flow

```
Sprint Created
  ↓
Correlation ID Generated: SPRINT-0.5-20260301165702-a1b2c3d4
  ↓
[TRACE:SPRINT-0.5-20260301165702-a1b2c3d4] Appears in EVERY log line
  ↓
Passed to subprocess: bug_fix_agent.py via args
  ↓
[TRACE:SPRINT-0.5-20260301165702-a1b2c3d4] In bug_fix_agent logs
  ↓
Saved in EVERY artifact:
  ├─ .eva/traces/BUG-F37-001-A-lm-calls.json
  ├─ .eva/evidence/BUG-F37-001-receipt.json
  ├─ Data model: PUT /model/wbs/BUG-F37-001 includes correlation_id
  └─ GitHub PR comment lists correlation_id
  ↓
Later: Query all work for this sprint
  GET /model/traces/?correlation_id=SPRINT-0.5-20260301165702-a1b2c3d4
  GET /model/wbs/?correlation_id=SPRINT-0.5-20260301165702-a1b2c3d4
  Returns: All 3 bugs + all 9 LM calls
```

---

## Cost Calculation Chain

```
LM Call: Phase A RCA
  ├─ Model: gpt-4o-mini
  ├─ Input tokens: 245
  ├─ Output tokens: 89
  │
  └─ Cost calculation:
      input_mult:   0.015  (from LLM_MODELS config)
      output_mult:  0.0075
      
      = (245 × 0.015) + (89 × 0.0075)
      = 3.675 + 0.6675
      = 4.3425
      
      × $0.00001 (GitHub Models unified rate per token unit)
      = $0.000043425
      ≈ $0.00004 (8-decimal precision)
      
LM Call: Phase B Fix
  ├─ Input: 312 → (312 × 0.015) = 4.68
  ├─ Output: 156 → (156 × 0.0075) = 1.17
  ├─ Sum: 5.85 × $0.00001 = $0.0000585
  └─ ≈ $0.00006
  
LM Call: Phase C Test
  ├─ Input: 198 → (198 × 0.015) = 2.97
  ├─ Output: 67 → (67 × 0.0075) = 0.5025
  ├─ Sum: 3.4725 × $0.00001 = $0.000034725
  └─ ≈ $0.00003

Total per bug (3 phases): $0.00004 + $0.00006 + $0.00003 = $0.00013
Total sprint (3 bugs): $0.00013 × 3 ≈ $0.00039

Saved to:
  ├─ .eva/traces/BUG-F37-001-{A,B,C}-lm-calls.json (summary field)
  ├─ .eva/evidence/BUG-F37-001-receipt.json (lm_interaction.cost_usd)
  └─ Sprint summary table (Cost Breakdown)
```

---

## Evidence Assembly Pipeline

```
Phase A: RCA
├─ LMTracer.call_lm("gpt-4o-mini", tokens_in=245, tokens_out=89)
├─ Save: .eva/traces/BUG-F37-001-A-lm-calls.json
└─ Timestamp A: submitted_to_lm_at, response_received_at


Phase B: Fix
├─ LMTracer.call_lm("gpt-4o-mini", tokens_in=312, tokens_out=156)
├─ Write fixed code to files
├─ Save: .eva/traces/BUG-F37-001-B-lm-calls.json
└─ Timestamp B: fix_applied_at


Phase C: Test
├─ LMTracer.call_lm("gpt-4o-mini", tokens_in=198, tokens_out=67)
├─ Run pytest: PASS
├─ Save: .eva/traces/BUG-F37-001-C-lm-calls.json
└─ Timestamp C: test_passed_at


END OF PHASES: write_evidence() called
├─ Read correlation_id from sprint_agent: SPRINT-0.5-20260301165702-a1b2c3d4
├─ Read first LM trace file: BUG-F37-001-A-lm-calls.json
├─ Load lm_interaction block (model, tokens, cost)
├─ Assemble timeline: created → A-submitted → A-response → B-fixed → C-tested → committed
├─ Assemble WBS: epic_id=FK-DPDCA-001, feature_id=F37-DPDCA-001, story_id=BUG-F37-001
├─ Final evidence record:
│  {
│    "correlation_id": "SPRINT-0.5-20260301165702-a1b2c3d4",
│    "story_id": "BUG-F37-001",
│    "epic_id": "FK-DPDCA-001",
│    "phase": "A" (or B, or C depending on phase completing),
│    "timeline": { all 6 timestamps },
│    "lm_interaction": { model, tokens, cost },
│    "status": "DONE",
│    "test_result": "PASS"
│  }
└─ Write: .eva/evidence/BUG-F37-001-receipt.json

POST /model/admin/commit
├─ Validate all evidence against evidence-schema.json
├─ Update data model:
│   PUT /model/wbs/BUG-F37-001 (status=done, received_timestamp)
│   PUT /model/traces/{correlation_id} (if Phase 2)
└─ Return: status=PASS, violation_count=0
```

---

## WBS Hierarchy Visualization

```
Epic: FK-DPDCA-001 (DPDCA for Bugs)
│
├─ Feature: F37-DPDCA-001 (Automate bug discovery & fixing)
│   │
│   ├─ Story: BUG-F37-001 (row_version not incremented)
│   │   └─ Phases: A (RCA) → B (Fix) → C (Test)
│   │       └─ 3 LM calls, 3 trace files, 1 evidence file
│   │
│   ├─ Story: BUG-F37-002 (endpoint field format mismatch)
│   │   └─ Phases: A (RCA) → B (Fix) → C (Test)
│   │       └─ 3 LM calls, 3 trace files, 1 evidence file
│   │
│   └─ Story: BUG-F37-003 (missing api.cosmos module)
│       └─ Phases: A (RCA) → B (Fix) → C (Test)
│           └─ 3 LM calls, 3 trace files, 1 evidence file

Total Files Created:
├─ Traces: 9 JSON files (.eva/traces/)
├─ Evidence: 3 JSON files (.eva/evidence/)
└─ GitHub API: 1 PR with cost summary
```

---

## Model Selection Decision Tree

```
Bug Severity?
├─ CRITICAL
│   └─ Use: gpt-4o (cost: $0.0012 per call)
│       Reason: Quality > cost
│       Example: "Row version recovery requires deep code archaeology"
│
├─ HIGH
│   └─ Use: gpt-4o-mini (cost: $0.00004 per call)
│       Reason: Template repair is standard
│       Example: "Add missing import statement"
│
├─ MEDIUM (default)
│   └─ Use: gpt-4o-mini (cost: $0.00004)
│       Reason: Cost-optimized, sufficient
│       Example: "Unit conversion bug"
│
└─ LOW
    └─ Use: gpt-4o-mini (cost: $0.00004)
        Reason: Cheapest, sufficient
        Example: "Format string typo"

Manual Override:
  story.severity = "CRITICAL"   # Escalates to gpt-4o
  story.severity = "LOW"         # Uses gpt-4o-mini
```

---

## GitHub Models Free Tier

```
Copilot Free Plan
  ├─ Rate: 15 requests/min, 150 requests/day
  ├─ Tokens: 8K per request
  ├─ Cost: $0.00001 per token unit (all models)
  │
  └─ Example: SPRINT-0.5
      ├─ Stories: 3
      ├─ Phases: 3 (A, B, C)
      ├─ Calls: 9 (3 × 3)
      ├─ Quota used: 9/150 = 6%
      ├─ Tokens used: 4,500/daily
      ├─ Cost: $0.00036
      └─ ✅ Well within free tier!

Alert Thresholds:
  ├─ 80% quota (120 requests): Consider batching sprints
  ├─ 95% quota (142 requests): Pause until daily reset
  └─ Daily reset: UTC midnight
```

---

## Phase 1 vs Phase 2 vs Phase 3

```
PHASE 1: Correlation ID + LM Tracing (2-3 hours, TODAY)
├─ Story F37-TRACE-001: Correlation ID infra
│   ├─ Generate ID: SPRINT-0.5-20260301-a1b2c3d4
│   ├─ Log: [TRACE:...] in every message
│   └─ Pass to subprocesses
│
└─ Story F37-TRACE-002: LM interaction logging
    ├─ Integrate LMTracer into bug_fix_agent.py
    ├─ Call tracer.call_lm() in phases A/B/C
    └─ Save .eva/traces/{story_id}-{phase}-lm-calls.json

RESULT: Tracing visible locally, costs calculated correctly


PHASE 2: Data Model Integration (2-3 hours, NEXT DAY)
├─ Story F37-TRACE-003: Data model trace endpoints
│   ├─ New layer: `traces` (see docs/library/03-DATA-MODEL-REFERENCE.md)
│   ├─ Endpoints: PUT/GET /model/traces/{correlation_id}
│   └─ Query: /model/traces/?sprint_id=SPRINT-0.5
│
└─ Story F37-TRACE-004: Artifact enrichment
    ├─ Timeline: 6 state transitions
    ├─ WBS: 4-level hierarchy
    └─ Evidence validation: jsonschema check

RESULT: Traces persisted in cloud, queryable by sprint/cost/model


PHASE 3: Cost Analysis & Insights (1.5 hours, DAY 3)
└─ Story F37-TRACE-005: Cost analysis & model selection
    ├─ Sprint summary: Total cost + breakdown table
    ├─ Model routing: CRITICAL→gpt-4o, else→gpt-4o-mini (automatic)
    ├─ Cost per FP: $0.0001-0.0004
    └─ Alerts: If cost > estimate + 20%

RESULT: Cost visibility + budget control + model optimization
```

---

## Observability Layers (L11: Evidence + Traces)

The **Evidence Layer** and **Traces Layer** form the observability plane of the EVA Data Model.
They capture proof-of-completion and LM call telemetry for every story in every sprint.

### Evidence Layer (`/model/evidence/`)

Canonical proof-of-completion for DPDCA phases. One evidence receipt per story per phase.

**When written:** After each phase of a story (D1, D2, P, D3, A)

**What it captures:**
- Merge-blocking validation gates (test_result=FAIL or lint_result=FAIL blocks PR merge)
- Coverage metrics (warns if <80% but does not block)
- Artifacts (files created/modified/deleted)
- Metrics (duration, files changed, lines added, LM tokens if used, cost in USD)
- Commits (git SHAs created in this phase)
- Correlation ID (ties all operations in a sprint together)

**Query examples:**
```powershell
# All evidence in a sprint
GET /model/evidence/?sprint_id=ACA-S11

# Evidence with FAIL gates (merge blockers)
GET /model/evidence/ | Where {$_.validation.test_result -eq "FAIL"}

# All phases of one story
GET /model/evidence/?story_id=ACA-14-001

# Low coverage (informational, not blocking)
GET /model/evidence/ | Where {$_.validation.coverage_percent -lt 80}
```

### Traces Layer (`/model/traces/`)

LM call telemetry: every model invocation, tokens, latency, cost, correlation ID.

**When written:** During Phase D (Do-Execute) when LM calls are made

**What it captures:**
- Model name (gpt-4o-mini, gpt-4o, etc)
- Input/output tokens + cost in USD (8-decimal precision)
- Latency (ms)
- Prompt + response hashes (for deduplication)
- Correlation ID (links to sprint + story + evidence)

**Query examples:**
```powershell
# All LM calls in a sprint
GET /model/traces/?correlation_id=SPRINT-0.5-20260301165702-a1b2c3d4

# Total cost per sprint
GET /model/traces/?sprint_id=ACA-S11 | Measure-Object -Property cost_usd -Sum
```

### Relationship Graph

```
Story (WBS)
  ↓ correlation_id
Evidence (Phase D1) → Evidence (Phase D2) → Evidence (Phase P) → Evidence (Phase D3) → Evidence (Phase A)
  ↓ correlation_id (during Phase D3)
Traces (LM Call 1, LM Call 2, ..., LM Call N)
  ↓
Portfolio Audit: "Cost per sprint", "Coverage by phase", "Merge blockers by project"
```

### Validation Gates (CI/CD Integration)

Evidence validation is automatic via `scripts/evidence_validate.ps1`:

```powershell
# Runs as merge gate (must exit 0)
.\scripts\evidence_validate.ps1

# Exit 0: all evidence valid, no blockers
# Exit 1: FAIL gates detected → PR blocked
```

Merge-blocking conditions:
- `validation.test_result = "FAIL"`
- `validation.lint_result = "FAIL"`

Non-blocking warnings:
- `validation.coverage_percent < 80%`

---

## Integration Points (Where Code Changes Happen)

```
sprint_agent.py
├─ Line 30: Add import LMTracer
├─ Line 860: Generate correlation_id
├─ Line 870: Log with [TRACE:...] prefix
├─ Line 920: Pass to bug_fix_agent.py subprocess
├─ Line 960: Update write_evidence() call
└─ Line 1050: Add cost summary to sprint summary

bug_fix_agent.py
├─ Line 40: Import LMTracer
├─ Line 120: Initialize tracer (correlation_id from args)
├─ Line 80-150: Phase A LM call → tracer.call_lm()
├─ Line 160-250: Phase B LM call → tracer.call_lm()
├─ Line 260-320: Phase C LM call → tracer.call_lm()
└─ Line 330: tracer.save()

lm_tracer.py
├─ 500 lines (ready to use)
├─ No modifications needed (production-ready code)
└─ Just import + call

.eva/evidence-schema.json
├─ Validation schema (ready)
├─ No modifications needed (Phase 1)
└─ Used in Phase 3 validation script
```

---

## Success Checkpoints

```
✅ CHECKPOINT 1: Correlation ID Generated
   Evidence: [TRACE:SPRINT-0.5-...] appears in logs
   Time: 30 min from Phase 1 start

✅ CHECKPOINT 2: LM Tracing Integrated
   Evidence: .eva/traces/ directory exists with 9 files
   Content: Each file has model, tokens, cost_usd > 0
   Time: 1 hour from Phase 1 start

✅ CHECKPOINT 3: Evidence Enriched
   Evidence: .eva/evidence/BUG-F37-001-receipt.json has correlation_id + lm_interaction
   Schema: Validates against evidence-schema.json (0 errors)
   Time: 1.5 hours from Phase 1 start

✅ CHECKPOINT 4: Cost Summary Visible
   Evidence: Sprint summary shows "Total Cost: $0.00XXX"
   Breakdown: Table with model counts + costs
   Time: 2 hours from Phase 1 start

✅ CHECKPOINT 5: Tests Pass
   Evidence: All pytest + lint PASS
   Verification: .eva/traces/* + .eva/evidence/* all validate
   Time: 2.5-3 hours from Phase 1 start

PHASE 1 COMPLETE ✅
```

---

