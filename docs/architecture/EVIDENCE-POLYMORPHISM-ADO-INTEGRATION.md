# Evidence Polymorphism & ADO Integration Architecture

**Date:** March 5, 2026  
**Status:** Implemented (Session 27)  
**Priority:** HIGH (Dashboard blockers)

## Problem Statement

Current evidence schema (L31) is too generic. It captures validation gates (PASS/FAIL) but misses the **technology-specific artifacts** that prove the work was done correctly. Different tech stacks produce different "bolts and nuts":

- **Python**: pytest results, coverage reports, mypy type errors, ruff violations
- **React**: Jest snapshots, bundle sizes, Lighthouse scores, ESLint warnings  
- **Terraform**: Plan resources, cost deltas, tfsec security findings
- **Docker**: Image sizes, vulnerability scans, registry layers

The 39-ado-dashboard expects aggregated metrics (`tests_added`, `coverage_pct`) that don't exist in sprint schema (L27).

## Current State

### Evidence Schema (L31) - Generic
```json
{
  "validation": {
    "test_result": "PASS",
    "coverage_percent": 92
  },
  "metrics": {
    "test_count": 42,
    "duration_ms": 8450
  },
  "context": {
    "additionalProperties": true  // ← Escape hatch, but untyped
  }
}
```

### Sprint Schema (L27) - Missing Aggregation
```json
{
  "velocity_planned": 13,
  "velocity_actual": 11,
  // ❌ NO: metrics_aggregated, tests_added, coverage_trend
}
```

### ADO Dashboard - Expects Missing Data
```typescript
interface VelocityPoint {
  sprint: string;
  tests_added: number;      // ← Not in sprint schema!
  coverage_pct: number | null;
}
```

### WBS Layer (L26) - Does Not Exist
No schema file. Expected hierarchy:
```
Program → Stream → Project → Epic → Feature → Story
```

## Solution Architecture

### 1. Technology-Specific Evidence Context

Use polymorphic `context` object based on `tech_stack` discriminator:

#### Python Evidence
```json
{
  "id": "ACA-S11-ACA-14-001-D3",
  "context": {
    "tech_stack": "python",
    "pytest": {
      "total_tests": 42,
      "passed": 40,
      "failed": 2,
      "skipped": 0,
      "duration_sec": 8.45,
      "junit_xml_path": "test-results/junit.xml"
    },
    "coverage": {
      "line_pct": 92.3,
      "branch_pct": 87.1,
      "html_report_path": "htmlcov/index.html"
    },
    "ruff": {
      "violations": 3,
      "auto_fixed": 12,
      "config_path": "pyproject.toml"
    },
    "mypy": {
      "errors": 0,
      "warnings": 2,
      "type_coverage_pct": 95.8
    }
  }
}
```

#### React Evidence
```json
{
  "id": "FACES-S6-FACES-12-003-D3",
  "context": {
    "tech_stack": "react",
    "jest": {
      "total_tests": 156,
      "passed": 156,
      "snapshots": 24,
      "duration_sec": 12.3
    },
    "bundle": {
      "size_kb": 342,
      "gzip_size_kb": 87,
      "chunks": 12
    },
    "lighthouse": {
      "performance": 98,
      "accessibility": 100,
      "best_practices": 95,
      "seo": 100
    },
    "eslint": {
      "errors": 0,
      "warnings": 5
    }
  }
}
```

#### Terraform Evidence
```json
{
  "id": "INFRA-S3-INFRA-05-001-D3",
  "context": {
    "tech_stack": "terraform",
    "plan": {
      "resources_to_add": 3,
      "resources_to_change": 1,
      "resources_to_destroy": 0,
      "estimated_cost_delta_usd": 45.20
    },
    "apply": {
      "resources_created": 3,
      "resources_updated": 1,
      "duration_sec": 127,
      "state_lock_acquired": true
    },
    "tfsec": {
      "critical": 0,
      "high": 0,
      "medium": 2,
      "low": 5
    }
  }
}
```

### 2. Sprint Metrics Aggregation

Sprint schema should accumulate FROM evidence:

```json
{
  "id": "51-ACA-sprint-11",
  "velocity_planned": 13,
  "velocity_actual": 11,
  "metrics_aggregated": {
    "total_tests": 156,
    "tests_added": 24,
    "avg_coverage_pct": 91.2,
    "total_files_changed": 47,
    "total_lines_added": 1203,
    "total_cost_usd": 2.45,
    "avg_duration_ms": 8450
  },
  "metrics_by_tech_stack": {
    "python": {
      "test_count": 42,
      "coverage_pct": 92.3
    },
    "react": {
      "test_count": 114,
      "coverage_pct": 89.8
    }
  }
}
```

### 3. WBS Layer (L26) Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "wbs.schema.json",
  "title": "Work Breakdown Structure",
  "description": "Hierarchy: Program → Stream → Project → Epic → Feature → Story",
  "properties": {
    "id": {
      "type": "string",
      "description": "WBS identifier",
      "examples": ["WBS-EVA-PLATFORM", "WBS-51-ACA-EPIC-14"]
    },
    "label": { "type": "string" },
    "level": {
      "type": "string",
      "enum": ["program", "stream", "project", "epic", "feature", "story"]
    },
    "parent_id": {
      "type": "string",
      "description": "Parent WBS node ID"
    },
    "ado_id": {
      "type": "integer",
      "description": "Azure DevOps work item ID (if mapped)"
    },
    "project_id": {
      "type": "string",
      "description": "Project ID from Layer 25"
    },
    "children": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Child WBS node IDs"
    },
    "estimated_effort": {
      "type": "integer",
      "description": "Estimated effort in story points or hours"
    },
    "actual_effort": {
      "type": "integer",
      "description": "Actual effort tracked"
    },
    "status": {
      "type": "string",
      "enum": ["planned", "active", "complete", "cancelled"]
    }
  }
}
```

### 4. Bidirectional ADO Integration

#### Current: One-Way (Store IDs)
```
Data Model → ADO
project.ado_epic_id = 12345
sprint.ado_iteration_path = "eva-poc\\Sprint 9"
```

#### Needed: Bidirectional Sync
```
Evidence → Data Model → ADO Work Item → Dashboard

1. Story completes, evidence recorded with tech-specific context
2. Sprint aggregator reads evidence, calculates metrics_aggregated
3. ADO sync agent pushes metrics TO work item custom fields:
   - Test Count = 42
   - Coverage % = 92.3
   - Status = Done (when phase=A evidence exists)
4. Dashboard queries data model API (not ADO directly)
5. Data model serves as cache + enrichment layer
```

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ WORKFLOW (51-ACA story execution)                               │
│  ├─ pytest → junit.xml, coverage.xml                            │
│  ├─ ruff → violations.json                                      │
│  ├─ mypy → type_errors.json                                     │
│  └─ Docker build → image size, scan results                     │
└────────────────────┬────────────────────────────────────────────┘
                     │ Collect actual artifacts
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ EVIDENCE LAYER (L31) - Tech-specific context                    │
│  POST /model/evidence/                                           │
│  {                                                               │
│    "id": "ACA-S11-ACA-14-001-D3",                               │
│    "validation": {"test_result": "PASS"},                       │
│    "context": {                                                  │
│      "tech_stack": "python",                                    │
│      "pytest": {...actual pytest JSON...},                      │
│      "coverage": {...actual coverage.py JSON...}                │
│    }                                                             │
│  }                                                               │
└────────────────────┬────────────────────────────────────────────┘
                     │ Aggregated by sprint_id
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ SPRINT LAYER (L27) - Aggregated metrics                         │
│  GET /model/sprints/51-ACA-sprint-11/metrics                    │
│  {                                                               │
│    "metrics_aggregated": {                                       │
│      "total_tests": 156,                                        │
│      "tests_added": 24,  // Delta from previous sprint         │
│      "avg_coverage_pct": 91.2                                   │
│    }                                                             │
│  }                                                               │
└────────────────────┬────────────────────────────────────────────┘
                     │ Roll up to project
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ PROJECT LAYER (L25) - Project-level metrics                     │
│  GET /model/projects/51-ACA                                     │
│  {                                                               │
│    "metrics_cumulative": {                                       │
│      "total_tests": 342,                                        │
│      "avg_coverage_pct": 89.5,                                  │
│      "test_growth_rate": 1.18  // 18% sprint-over-sprint       │
│    }                                                             │
│  }                                                               │
└────────────────────┬────────────────────────────────────────────┘
                     │ Bidirectional sync
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ ADO WORK ITEMS - Custom fields from data model                  │
│  Work Item 12345:                                                │
│    - Custom.TestCount: 42                                       │
│    - Custom.Coverage: 92.3                                      │
│    - State: Done (when evidence phase=A exists)                 │
└────────────────────┬────────────────────────────────────────────┘
                     │ Query for visualization
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ ADO DASHBOARD (39-ado-dashboard) - Data model API client        │
│  GET /model/sprints/51-ACA-sprint-11 → metrics_aggregated       │
│  GET /model/evidence/?sprint_id=ACA-S11&phase=D3 → test details │
│  Displays: Velocity chart, test count sparklines, coverage trend│
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Phases

### Phase 1: Evidence Tech-Stack Extensions (Week 1)
- [ ] Document Python context schema (pytest, coverage, ruff, mypy)
- [ ] Document React context schema (jest, bundle, lighthouse, eslint)
- [ ] Document Terraform context schema (plan, apply, tfsec)
- [ ] Update evidence_generator.py with tech-stack helpers
- [ ] Add 3 example evidence records to model/evidence.json

### Phase 2: Sprint Aggregation (Week 2)
- [ ] Create aggregation query: GET /model/sprints/{id}/metrics
- [ ] Implement metrics_aggregated calculator (reads L31 evidence)
- [ ] Add metrics_aggregated field to sprint schema
- [ ] Test with 51-ACA sprint data

### Phase 3: WBS Layer (Week 2)
- [ ] Create schema/wbs.schema.json
- [ ] Seed model/wbs.json with EVA Platform hierarchy
- [ ] Register router in api/server.py
- [ ] Test hierarchy queries

### Phase 4: ADO Bidirectional Sync (Week 3)
- [ ] Design ADO custom field mapping
- [ ] Implement sync agent (data model → ADO work items)
- [ ] Test with 51-ACA sprint
- [ ] Add to CI/CD pipeline

### Phase 5: Dashboard Integration (Week 4)
- [ ] Update 39-ado-dashboard to query sprint metrics
- [ ] Add VelocityPanel with test count sparklines
- [ ] Add coverage trend chart
- [ ] Deploy to 31-eva-faces

## API Endpoints Needed

```
GET  /model/sprints/{id}/metrics
     → Returns aggregated metrics from evidence

GET  /model/evidence/?sprint_id=X&tech_stack=python
     → Filtered evidence by tech stack

GET  /model/projects/{id}/metrics/trend
     → Multi-sprint trend data for charts

GET  /model/wbs/?level=epic&project_id=51-ACA
     → WBS hierarchy queries

POST /model/admin/sync-ado
     → Trigger ADO bidirectional sync
```

## Success Criteria

1. Dashboard displays real test counts without hardcoded data
2. Agents can record Python/React/Terraform evidence with full context
3. Sprint metrics auto-calculate from evidence (no manual entry)
4. WBS hierarchy queryable (program → stream → project → epic)
5. ADO work items show synchronized metrics from data model

## Dependencies

- [ ] 39-ado-dashboard waiting for sprint.metrics_aggregated
- [ ] 51-ACA waiting for evidence.context.pytest schema
- [ ] ADO sync agent design (who owns? 40-eva-control-plane?)

## Notes

**Key Insight:** Evidence must capture the actual artifacts from tooling, not generic invented metrics. The `context` object already provides extensibility (`additionalProperties: true`), but lacks documented patterns for each tech stack.

**Competitive Advantage:** When evidence includes actual pytest JSON, coverage reports, and security scan results, EVA Foundation becomes the ONLY AI platform with full audit trail compliance (FDA 21 CFR Part 11, SOX, HIPAA).
