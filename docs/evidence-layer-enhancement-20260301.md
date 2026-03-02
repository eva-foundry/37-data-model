# Evidence Layer Enhancement — Project 37 (Data Model)

**Version:** 1.0.0  
**Date:** March 1, 2026  
**Phase:** Discover + Plan  
**Sprint:** 11 (Foundation Phase 3)  
**Related:** [Sprint 11 Phase 2 Evidence Catalog](../../51-ACA/docs/EVIDENCE-CATALOG-SPRINT11-PHASE2.md)

---

## Executive Summary

The **Evidence Layer** is a new canonical data model layer that captures proof-of-completion for every story in the DPDCA cycle (Discover → Plan → Do → Check → Act).

**Current state:** Evidence receipts are ad-hoc JSON files, one per story.  
**Target state:** Generic evidence schema in 37-data-model, used by all projects (51-ACA, 31-eva-faces, 33-eva-brain-v2, etc.).

This document describes what to build, why, and step-by-step instructions for implementation.

---

## 1. Current State (Discover Phase)

### 1.1 What exists today

**Evidence Receipts (Ad-hoc)**
- Location: `{project}/.eva/evidence/{STORY-ID}-receipt.json`
- Example (51-ACA): `ACA-03-001-receipt.json`
- Current fields:
  ```json
  {
    "story_id": "ACA-03-001",
    "title": "Rule loader story",
    "phase": "A",
    "timestamp": "2026-03-01T15:06:39Z",
    "artifacts": ["file1.py", "file2.py"],
    "test_result": "WARN",
    "lint_result": "WARN",
    "commit_sha": "07ff958...",
    "duration_ms": 7850,
    "tokens_used": 0,
    "test_count_before": 0,
    "test_count_after": 0,
    "files_changed": 2
  }
  ```

**Issues with current approach:**
- ✗ Schema is implicit (no JSON schema definition)
- ✗ Fields vary per project (ACA uses different fields than others)
- ✗ Not discoverable via data model API
- ✗ No validation rules (evidence can be incomplete)
- ✗ No relationship to sprint/story layers in the model
- ✗ Cannot be queried for portfolio-level evidence compliance

### 1.2 What's already in the data model

**Trace Layer** (`schema/trace.schema.json`)
- Purpose: Captures LM (language model) calls: model, tokens, cost, latency
- Partition key: `correlation_id`
- Connected to: `sprint_id`, `story_id`, phase
- Status: Fully defined, ready to use

**Current Model Layers (27 total)**
- L0-L2: Foundation (services, endpoints, containers)
- L3-L5: Data (hooks, components, agents)
- L6-L7: UI (screens, pages)
- L8-L9: Infrastructure (services, MCP servers)
- L10: Requirements (requirements, decisions, risks)
- L11+: Not yet formalized

**Key insight:** Evidence is NOT story-specific (ACA's "infrastructure story" != "API endpoint story"). Evidence is **phase-specific**: what proof do we need to show that **any** story completed phase D1, D2, P, D3, or A?

### 1.3 What the DPDCA cycle captures

From copilot-instructions and 51-ACA implementation:

| Phase | What happens | What evidence proves completion |
|-------|--------------|------|
| **D1 (Discover)** | Query data + existing sources | Evidence files exist for this sprint/project |
| **D2 (Discover-Repo)** | Run tests + linters + audits | Test results, lint results, audit reports |
| **P (Plan)** | Design stories + schema + validation | PLAN.md updated, story manifest created |
| **D3 (Do-Execute)** | Implement stories, generate code | Source files changed, commits created |
| **A (Act)** | Record results, close loop | Evidence receipts persisted, context saved |

**Universal evidence across all phases:**
- Correlation ID (ties everything together)
- Sprint ID + Story ID (what was worked on)
- Phase (D1/D2/P/D3/A)
- Timestamp (when completed)
- Artifacts (files changed, commits, test reports)
- Validation gates (did tests pass? did lint pass?)
- Cost tracking (tokens used if LM calls made)
- Duration (how long did this phase take)

---

## 2. Target Design (Plan Phase)

### 2.1 Evidence Layer Definition

**Name:** `evidence`  
**Partition key (Cosmos):** `correlation_id`  
**Schema file:** `schema/evidence.schema.json`  
**Data file:** `model/evidence.json`  
**Purpose:** Canonical record of proof-of-completion for any story in any project

### 2.2 Evidence Schema (Universal)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "evidence.schema.json",
  "title": "EVA Evidence Receipt",
  "description": "Proof-of-completion for a DPDCA phase of a story. Universal schema works for any story type (feature, bug, infrastructure, etc) and any project.",
  "type": "object",
  "required": ["id", "sprint_id", "story_id", "phase", "created_at"],
  "additionalProperties": false,
  "properties": {
    "id": {
      "type": "string",
      "description": "Business key: {SPRINT_ID}-{STORY_ID}-{PHASE}. Example: 'ACA-S11-ACA-14-001-A'",
      "examples": ["ACA-S11-ACA-14-001-A", "F37-S01-F37-01-001-P"]
    },
    "correlation_id": {
      "type": ["string", "null"],
      "description": "Correlation ID that ties together all operations in this sprint: format ACA-S{NN}-{YYYYMMDD}-{uuid[:8]}",
      "examples": ["ACA-S11-20260301-285bd914"]
    },
    "sprint_id": {
      "type": "string",
      "description": "Reference to sprints.id (e.g. 'ACA-S11' or 'F37-S01')"
    },
    "story_id": {
      "type": "string",
      "description": "Story ID being completed (e.g. 'ACA-14-001', 'F37-01-001')"
    },
    "story_title": {
      "type": ["string", "null"],
      "description": "Story title for readability"
    },
    "phase": {
      "type": "string",
      "enum": ["D1", "D2", "P", "D3", "A"],
      "description": "DPDCA phase: D1=discover, D2=discover-audit, P=plan, D3=do-execute, A=act"
    },
    "created_at": {
      "type": "string",
      "format": "date-time",
      "description": "When this evidence was recorded (RFC3339)"
    },
    "completed_at": {
      "type": ["string", "null"],
      "format": "date-time",
      "description": "When the phase actually completed (may differ from created_at if recorded later)"
    },
    "summary": {
      "type": ["string", "null"],
      "description": "Human-readable summary of what was accomplished"
    },
    "artifacts": {
      "type": "array",
      "description": "Artifacts produced or modified in this phase",
      "items": {
        "type": "object",
        "properties": {
          "path": {
            "type": "string",
            "description": "File or resource path (e.g. 'services/analysis/app/main.py')"
          },
          "type": {
            "type": "string",
            "enum": ["source", "test", "schema", "config", "doc", "report", "other"],
            "description": "Artifact type"
          },
          "action": {
            "type": "string",
            "enum": ["created", "modified", "deleted"],
            "description": "What happened to this artifact"
          }
        }
      }
    },
    "validation": {
      "type": "object",
      "description": "Validation gate results (merge blockers if failed)",
      "properties": {
        "test_result": {
          "type": "string",
          "enum": ["PASS", "FAIL", "WARN", "SKIP"],
          "description": "Test suite result (FAIL blocks merge)"
        },
        "lint_result": {
          "type": "string",
          "enum": ["PASS", "FAIL", "WARN", "SKIP"],
          "description": "Lint/format check result (FAIL blocks merge)"
        },
        "coverage_percent": {
          "type": ["integer", "null"],
          "minimum": 0,
          "maximum": 100,
          "description": "Code coverage % (warn if <80%)"
        },
        "audit_result": {
          "type": "string",
          "enum": ["PASS", "FAIL", "WARN", "SKIP"],
          "description": "Security/compliance audit result"
        },
        "messages": {
          "type": "array",
          "items": {"type": "string"},
          "description": "Detailed validation messages or errors"
        }
      }
    },
    "metrics": {
      "type": "object",
      "description": "Performance and cost metrics",
      "properties": {
        "duration_ms": {
          "type": ["integer", "null"],
          "description": "How long the phase took (milliseconds)"
        },
        "files_changed": {
          "type": ["integer", "null"],
          "description": "Number of files added/modified/deleted"
        },
        "lines_added": {
          "type": ["integer", "null"],
          "description": "Lines of code added"
        },
        "lines_deleted": {
          "type": ["integer", "null"],
          "description": "Lines of code deleted"
        },
        "tokens_used": {
          "type": ["integer", "null"],
          "description": "LM tokens used in this phase (if any LM calls made)"
        },
        "cost_usd": {
          "type": ["number", "null"],
          "description": "Cost in USD if LM calls made (8 decimals)"
        },
        "test_count": {
          "type": ["integer", "null"],
          "description": "Total test count after phase"
        }
      }
    },
    "commits": {
      "type": "array",
      "description": "Git commits created in this phase",
      "items": {
        "type": "object",
        "properties": {
          "sha": {
            "type": "string",
            "description": "Commit SHA (7+ hex chars)"
          },
          "message": {
            "type": "string",
            "description": "Commit message"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time",
            "description": "When committed"
          }
        }
      }
    },
    "context": {
      "type": "object",
      "description": "Additional context or metadata specific to this story/phase",
      "additionalProperties": true
    }
  }
}
```

### 2.3 Why this schema works for ANY project

| Scenario | How schema handles it |
|----------|----------------------|
| Infrastructure story (51-ACA) | `validation.audit_result` captures infrastructure scanning; `artifacts` lists config files |
| API endpoint story (31-eva-faces) | `validation.test_result` captures OpenAPI validation; `artifacts` lists router files |
| Frontend component story | `validation.coverage_percent` + `artifacts` with component paths |
| Data collection story | `validation.test_result` + metrics.lines_added for data transformation code |
| CI/CD pipeline story | `validation.lint_result` + `artifacts` with workflow files |
| **All stories** | correlation_id ties everything; phase shows what lifecycle stage; validation gates ensure merge quality |

**Key principle:** Evidence schema captures **PROCESS OUTPUT** (tests ran, files changed, commits made), not **STORY TYPE** (infrastructure vs. API vs. frontend).

### 2.4 Implementation Checklist for Project 37

#### Phase 1: Schema + Model Files

- [ ] **Create schema file:** `schema/evidence.schema.json` (380 lines)
  - Copy the JSON schema above
  - Validate with `python -m jsonschema`

- [ ] **Create model file:** `model/evidence.json` (empty array initially)
  ```json
  {
    "layer": "evidence",
    "version": "1.0.0",
    "description": "DPDCA evidence receipts for all stories in all sprints",
    "objects": []
  }
  ```

- [ ] **Register layer in API:** `api/routers/evidence.py`
  - GET `/model/evidence/` → list all evidence
  - GET `/model/evidence/{id}` → single evidence record
  - PUT `/model/evidence/{id}` → update evidence (with audit fields + X-Actor header)
  - Filter: `GET /model/evidence/filter?sprint_id=ACA-S11&phase=A`

- [ ] **Add validation rules:** `scripts/evidence-validate.ps1`
  - Check `validation.test_result=FAIL` → block merge
  - Check `validation.lint_result=FAIL` → block merge
  - Check `validation.coverage_percent < 80` → warn (not block)
  - Check all required fields present

#### Phase 2: Integration Points

- [ ] **Connect to sprints layer**
  - Evidence.sprint_id must exist in sprints.id
  - Add `layer: "evidence"` validation to impact-analysis.ps1

- [ ] **Connect to stories (via story_id)**
  - Evidence.story_id can reference WBS in 51-ACA (or generically, any project)
  - Document that story_id format varies by project (ACA-14-001, F37-S01-F37-01-001, etc)

- [ ] **Connect to traces layer** (optional but recommended)
  - If correlation_id matches trace.id, evidence + trace can be queried together
  - Add graph relationship: evidence --references--> trace

#### Phase 3: Tools + Scripts

- [ ] **Create evidence generator library:** `.github/scripts/evidence_generator.py` (in 37-data-model)
  - Generic EvidenceBuilder class (not project-specific)
  - Methods: add_universal(), add_validation(), add_metrics(), add_artifacts(), validate(), persist()
  - Used by all projects via import

- [ ] **Create evidence validator:** `.github/scripts/evidence_validate.ps1`
  - Runs as CI gate
  - Loads evidence-schema.json
  - Checks all objects in model/evidence.json against schema
  - Reports FAIL if merge-blocking gates fail

- [ ] **Create evidence query tool:** `scripts/evidence-query.py`
  - `--sprint ACA-S11 --phase A` → all evidence for sprint/phase
  - `--story ACA-14-001` → all phases of a story
  - `--correlation-id ACA-S11-20260301-...` → trace this entire sprint
  - Output: summary table or JSON

#### Phase 4: Documentation

- [ ] **Update USER-GUIDE.md**
  - Add section: "Evidence Layer — Proof of Completion"
  - Query examples
  - Write cycle (POST evidence after each phase)

- [ ] **Update ARCHITECTURE.md**
  - Evidence layer fits in L11-L14 (Observability plane)
  - Diagram: Evidence ← connects to → Traces, Sprints, Stories

- [ ] **API OpenAPI spec update** (`model-api-openapi.json`)
  - Add evidence endpoints

### 2.5 Acceptance Criteria

| Criterion | How to verify |
|-----------|---------------|
| Schema is valid JSON Schema | `python -m jsonschema schema/evidence.schema.json` exits 0 |
| Evidence objects can be: created | `PUT /model/evidence/test-id` with valid payload → 200 OK |
| Evidence objects can be: read | `GET /model/evidence/test-id` → returns same payload |
| Evidence objects can be: listed | `GET /model/evidence/?sprint_id=X` → returns filtered array |
| Evidence can be queried by sprint | `GET /model/evidence/?sprint_id=ACA-S11` returns all sprint evidence |
| Evidence can be queried by phase | `GET /model/evidence/?phase=A` returns all Act-phase evidence |
| Validation gates work | PUT evidence with `test_result=FAIL` + validate script → script reports FAIL |
| Merge gate integrated | CI/CD pipeline runs validate script before merge |
| Generator library works | Python: `from eva_tools.evidence import EvidenceBuilder; gen = EvidenceBuilder(...); gen.persist()` |
| Cross-project compatible | Zero project-specific code in generator (no ACA, F37 hardcodes) |

---

## 3. Why This Matters

### 3.1 Problem solved

**Before:**
```
Agent completes a story.
Writes evidence to .eva/evidence/story-id.json
Nobody can query it via API.
Nobody can enforce validation.
Different projects use different schemas.
Portfolio-level compliance reporting impossible.
```

**After:**
```
Agent completes a story.
Calls PUT /model/evidence/{id} with universal schema.
Evidence queryable via API.
Validation gates enforced in CI/CD.
All projects use same schema.
Portfolio-level compliance: GET /model/evidence/?phase=A | measure test_result=FAIL count
```

### 3.2 Downstream use cases (why all projects need this)

1. **51-ACA Sprint 11 Phase 3+**: Will call `PUT /model/evidence/{id}` to record story completion
2. **31-eva-faces Admin workflow**: Will query `GET /model/evidence/?story_id=FACES-*&test_result=FAIL` for failing features
3. **33-eva-brain-v2 Release notes**: Will query `GET /model/evidence/?sprint_id=BRAIN-S05&phase=A` to list all completed stories
4. **Portfolio audits**: Will query `GET /model/evidence/?phase=D1` to measure how many stories started discovery
5. **Cost tracking**: Will sum `evidence[*].metrics.cost_usd` to report total agent spend per sprint

### 3.3 Integration with existing layers

```
Evidence connects to (impact analysis):
  - sprints: evidence.sprint_id --FK--> sprints.id
  - traces: evidence.correlation_id --FK--> traces.id (when both exist)
  - stories (WBS): evidence.story_id --FK--> wbs.story_id (loose, project-specific)

Evidence fed by (upstream producers):
  - sprint_agent.py (51-ACA, 31-eva-faces, 33-eva-brain-v2): calls evidence generator
  - control-plane (40-eva-control-plane): receives evidence via HTTP webhook

Evidence consumed by (downstream readers):
  - CI/CD gates: evidence_validate.ps1 blocks merge if FAIL gates present
  - Portfolio dashboards: GET /model/evidence/?phase=A counts completed stories
  - Audit trails: GET /model/admin/audit filters by "evidence" layer
```

---

## 4. Step-by-Step Implementation Guide

### 4.1 Dependencies (already available in project 37)

```
Pydantic          → model validation
FastAPI           → HTTP API routing
Cosmos DB          → persistence
jsonschema        → schema validation
pytest            → testing
```

### 4.2 File structure after implementation

```
37-data-model/
├── schema/
│   └── evidence.schema.json          ← NEW
├── model/
│   └── evidence.json                 ← NEW (empty initially)
├── api/
│   └── routers/
│       └── evidence.py               ← NEW (GET, PUT endpoints)
├── .github/
│   └── scripts/
│       ├── evidence_generator.py     ← NEW (generic builder class)
│       └── evidence_query.py         ← NEW (query tool)
├── scripts/
│   └── evidence_validate.ps1         ← NEW (CI gate)
├── docs/
│   ├── evidence-layer-enhancement-20260301.md  ← THIS FILE
│   └── EVIDENCE-LAYER-IMPLEMENTATION-F37.md    ← Generated after Plan → Do transition
```

### 4.3 Success criteria per implementation phase

**Schema + Model (2-3 hours)**
- `schema/evidence.schema.json` created and validates
- `model/evidence.json` created with empty objects array
- Schema PR reviewed and merged

**API Endpoints (3-4 hours)**
- GET `/model/evidence/` [pass test]
- GET `/model/evidence/{id}` [pass test]
- PUT `/model/evidence/{id}` with audit fields [pass test]
- Filter by sprint_id, phase, story_id [pass test]

**Validation + Tools (3-4 hours)**
- evidence-validate.ps1 runs in CI [pass test]
- EvidenceBuilder class importable [pass test]
- Evidence query tool works [pass test]

**Integration + Documentation (2-3 hours)**
- USER-GUIDE.md updated
- ARCHITECTURE.md updated
- OpenAPI spec updated
- Evidence referenced in copilot-instructions

**Total estimated effort:** 10-15 hours for project 37 team

---

## 5. Resources & Pointers for Implementation

### 5.1 Existing code to reference

| Resource | Purpose | Location |
|----------|---------|----------|
| API server structure | How to add a new router | `api/server.py`, `api/routers/*.py` |
| ModelObject base class | Audit field handling | `api/models/base.py` |
| Trace schema (reference) | Similar layer with LM data | `schema/trace.schema.json` |
| Filter implementation | How to filter endpoints | `api/routers/endpoints.py` (if exists) |
| PUT handler | How to write with audit fields | Look at any PUT endpoint in `routers/*.py` |
| Store implementation | How Cosmos is accessed | `api/store/*.py` |
| Validation script ref | Schema validation pattern | `scripts/validate-model.ps1` |

### 5.2 Data model API docs (for reference during implementation)

- [USER-GUIDE.md](./USER-GUIDE.md) — Section 8 "After Your Work — Updating the Model"
- [/model/admin/validate endpoint](https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io/docs) — HTTP API documentation

### 5.3 Test approach

After each phase, test with:

```powershell
# Test schema validity
python -m jsonschema schema/evidence.schema.json

# Test API endpoint exists
curl https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io/model/evidence/

# Test PUT + GET roundtrip
$body = @{
  id = "TEST-1"
  sprint_id = "TEST-SPRINT"
  story_id = "TEST-001"
  phase = "A"
  created_at = (Get-Date -Format o)
} | ConvertTo-Json
Invoke-RestMethod "$base/model/evidence/TEST-1" -Method PUT -Body $body -ContentType application/json
```

### 5.4 Downstream projects will need

Once project 37 completes this enhancement:

1. **51-ACA (Phase 3 onwards):** Update sprint_agent.py to call new evidence endpoints
2. **31-eva-faces:** Import evidence_generator.py and use in testing workflows
3. **33-eva-brain-v2:** Query evidence layer for release notes via API
4. **40-eva-control-plane:** Store evidence receipts received from agents

---

## 6. Context for Future Phase 3+ Work

### 6.1 51-ACA Sprint 11 Phase 3 (Cloud Integration)

After evidence layer exists in project 37:

- **ACA-14-005:** Integrate evidence endpoints
  - Call `PUT /model/evidence/{id}` at end of each DPDCA phase
  - Receive validation failures → block merge if FAIL gates present
  
- **ACA-14-006:** Connect to control plane
  - POST evidence to /v1/evidence (40-eva-control-plane)
  - Evidence becomes part of runtime audit trail

### 6.2 Multi-project orchestration (Future)

Once evidence exists in data model:

```python
# Query evidence across ALL projects
evidence = requests.get(
    "https://api/model/evidence/",
    params={"phase": "A", "validation.test_result": "FAIL"}
)
failing_stories = evidence.json()  # Every project, all failing tests

# Generate portfolio report
for story in failing_stories:
    print(f"  {story['story_id']} ({story['sprint_id']}): {story['validation']['messages']}")
    # -> ACA-14-001 (ACA-S11): Tests failed: test_evidence_generator
    # -> FACES-23-001 (FACES-S03): Lint failed: trailing whitespace
```

---

## 7. Key Decisions

### Decision 1: Schema location
**Choice:** `schema/evidence.schema.json` in project 37 (not per-project)  
**Rationale:** Single schema means all projects must conform; eliminates fragmentation.

### Decision 2: ID format
**Choice:** `{SPRINT_ID}-{STORY_ID}-{PHASE}`  
**Rationale:** Composite key is unique across all projects and all phases. Easy to trace.

### Decision 3: Validation gates
**Choice:** test_result=FAIL and lint_result=FAIL block merge (additionalProperties prevents unknown fields)  
**Rationale:** Quality gates must be enforced; schema strictness prevents schema drift.

### Decision 4: Separate from Traces
**Choice:** Evidence and Traces are separate layers (not merged)  
**Rationale:** Traces = LM call details (specific); Evidence = proof of phase completion (broader). Different query patterns.  
**Connection:** Optional FK relationship via correlation_id for correlated queries.

---

## 8. Done Criteria (by project 37 team)

**This document complete when:**

- [ ] Schema file created and validated
- [ ] Model file created
- [ ] API router implemented (GET, PUT, filter)
- [ ] Validation script created
- [ ] Generator library created (in tools you can share)
- [ ] Documentation updated (USER-GUIDE, ARCHITECTURE, API spec)
- [ ] All tests passing
- [ ] PR merged to main
- [ ] ADO work item(s) marked Done

**Then:** 51-ACA and other projects can begin using the evidence layer in Sprint 11 Phase 3+

---

## 9. Questions for Project 37 Team

1. **Cosmos partition key:** Should evidence use `correlation_id` or `sprint_id`? (affects query performance)
2. **Empty context object:** Should `context` be required or optional? (I recommend optional for flexibility)
3. **Retention policy:** Should evidence be archived after N days? (like traces do)
4. **Version migration:** How to handle schema changes in future sprints? (versioning strategy)

---

**Next step:** Once this Plan is reviewed, project 37 moves to **Do Phase** (implementation).  
**Timeline:** 10-15 hours estimated for project 37 to complete and merge to main.  
**Downstream:** 51-ACA Phase 3 can then begin using these endpoints immediately.

---

*Document prepared for Project 37 (EVA Data Model) implementation team.*  
*Reference: [Copilot Instructions Evidence Framework](../../.github/copilot-instructions.md)*
