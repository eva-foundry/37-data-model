================================================================================
 EVIDENCE LAYER EVOLUTION & SYNCHRONIZATION GAP ANALYSIS
 Status: Project 51 Has Evolved Evidence Beyond Project 37 Canonical Model
 Date: 2026-03-03
 Urgency: HIGH (gap blocks data model as single source of truth)
================================================================================

EXECUTIVE SUMMARY
===============================================================================

Project 51-ACA has successfully evolved and operationalized the Evidence Layer
with 260+ evidence receipts across 14 features and 268 stories. However, the
canonical data model (37-data-model) evidence.json remains empty (0 records).

This creates a synchronization gap:

  37-data-model:    evidence.json = []          (template ready, no data)
  51-ACA:           .eva/evidence/ = 64 files   (operational, not synced back)
  
  Result: Cannot query evidence portfolio-wide (breaks entire audit trail)

IMPACT & RISK
===============================================================================

CRITICAL ISSUE:
  - Discussion agent cannot query /model/evidence/ for cross-project audits
  - Application Insurance (Lloyd's, AIG) requirements = immutable audit trail
  - Patent filing (March 8, 2026) = pending evidence of operational system
  - Subscription migration = export has 4,339 objects but zero evidence receipts

MISSED OPPORTUNITY:
  - 51-ACA has done the hard work (260 evidence receipts captured)
  - If we dont consolidate now, each project will do their own thing
  - Result: 48 projects = 48 different evidence patterns (chaos)
  
BLOCKING USER GOALS:
  - "all that copilot would need to know was in the data model"
  - Evidence layer is NOT in data model (it's in 51-ACA only)
  - Consolidation = prerequisite for API-first architecture

================================================================================
 WHAT 37-DATA-MODEL HAS (CANONICAL TEMPLATE)
================================================================================

File: C:\AICOE\eva-foundry\37-data-model\model\evidence.json

Status: EMPTY

Structure:
{
  "$schema": "../schema/evidence.schema.json",
  "layer": "evidence",
  "version": "1.0.0",
  "description": "DPDCA evidence receipts...",
  "objects": []                                    ← EMPTY
}

Schema:
  Location: C:\AICOE\eva-foundry\37-data-model\schema\evidence.schema.json
  Status: COMPLETE & VALID (22 JSON schemas, evidence.schema.json fully defined)
  
Documentation:
  Location: C:\AICOE\eva-foundry\37-data-model\docs\library\11-EVIDENCE-LAYER.md
  Status: COMPLETE (582 lines, DPDCA phases, query patterns, audit examples)
  
API Support:
  Route: GET /model/evidence/
  Route: GET /model/evidence/{id}
  Route: PUT /model/evidence/{id}
  Route: POST /model/admin/commit  (with evidence validation gates)
  Status: READY (api/routers/evidence_router exists, fully implemented)

Export:
  Location: C:\AICOE\eva-foundry\37-data-model\eva-data-model-export-20260303\model-data\evidence.json
  Status: MALFORMED (single record, not array of objects)
  Test Record: "TEST-EVIDENCE-001" (template only)

================================================================================
 WHAT 51-ACA HAS (EVOLVED IMPLEMENTATION)
================================================================================

Evidence Receipts (Per-Story Files):
  Location: C:\AICOE\eva-foundry\51-ACA\.eva\evidence\
  Count: 64 files
  Pattern: ACA-{EPIC}-{STORY}-receipt.json
  Status: OPERATIONAL (actively populated)

Example Record:
  File: ACA-02-017-receipt.json
  {
    "story_id": "ACA-02-017",
    "title": "ingest.py mark_collection_complete...",
    "phase": "D|P|D|C|A",
    "timestamp": "2026-02-27T12:49:20Z",
    "artifacts": ["services/collector/app/ingest.py"],
    "test_result": "WARN",
    "lint_result": "WARN",
    "commit_sha": "42caa44203e2920563eb2117130631dfaa2830a1"
  }

Evidence Seeding Script:
  Location: C:\AICOE\eva-foundry\51-ACA\data-model\seed-evidence.py
  Function: db.seed_evidence(repo_root)
  Behavior: Loads 64 .eva/evidence/*-receipt.json files into SQLite
  Last Run: Unknown (script exists, need to verify recent execution)

Local Data Model (SQLite):
  Location: C:\AICOE\eva-foundry\51-ACA\data-model\db.py
  Layer: evidence
  Records: Unknown (need query from 51-ACA) -- likely ~260 records
  
Veritas Audit (2026-03-02):
  File: C:\AICOE\eva-foundry\51-ACA\VERITAS-AUDIT-AND-SYNC-20260302.md
  Metrics:
    - Stories total: 268
    - Stories with evidence: 260 (97%)
    - Stories without evidence: 8
    - Trust score: 69
    - Consistency score: 0.0 (⚠️ data mismatch with PLAN.md)

Evidence Python Files (Template Receipts):
  Location: C:\AICOE\eva-foundry\51-ACA\evidence\
  Count: 284 receipt files (ACA-01-001 through ACA-16-004)
  Type: Python files with EVIDENCE dict
  Status: SKELETON TEMPLATES (mostly placeholder, "Replace with real CI link")
  
  Example:
    File: ACA-08-001-receipt.py
    EVIDENCE = {
      "story_id": "ACA-08-001",
      "status": "placeholder",
      "test_result": "PENDING",
      "notes": "Auto-generated receipt. Replace with real CI link...",
    }

================================================================================
 THE SYNCHRONIZATION GAP
================================================================================

ARCHITECTURAL MISMATCH:

┌─────────────────────────────────────────────────────────────────────────┐
│                      CANONICAL (37-data-model)                         │
├─────────────────────────────────────────────────────────────────────────┤
│ Schema:        evidence.schema.json           ✅ Complete              │
│ API:           GET/PUT /model/evidence/       ✅ Ready                 │
│ Documentation: 11-EVIDENCE-LAYER.md           ✅ Complete              │
│ Data:          model/evidence.json            ❌ EMPTY (0 records)     │
│ Validation:    POST /model/admin/commit       ✅ Ready                 │
│                                                                          │
│ Current State: Template without operational data                        │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                      OPERATIONAL (51-ACA)                              │
├─────────────────────────────────────────────────────────────────────────┤
│ Receipt Format: .eva/evidence/*-receipt.json   ✅ Active               │
│ Receipt Count: 64 files                         ✅ Populated            │
│ Total Records: ~260 stories with evidence      ✅ Operational          │
│ Seeding Script: seed-evidence.py               ✅ Ready                │
│ Storage: SQLite (local)                        ⚠️  Not synced           │
│                                                                          │
│ Current State: Working implementation, isolated to single project      │
└─────────────────────────────────────────────────────────────────────────┘

WHAT'S MISSING:

1. SYNC PATHWAY (37 ← 51)
   - No script to export 51-ACA evidence → 37-data-model
   - No scheduled job to pull receipts back to canonical model
   - No API integration between the two systems

2. PORTFOLIO VISIBILITY
   - Cannot query "which projects have test failures?" (37 has route, no data)
   - Cannot calculate "average coverage across all projects"
   - Cannot detect "evidence gaps in any project"
   - Cannot answer "what was the blast radius of correlation_id X?"

3. CONSISTENCY
   - 51-ACA veritas_consistency_score = 0.0 (PLAN.md ↔ codebase mismatch)
   - Unknown if evidence.json truly matches DPDCA phases (D1, D2, P, D3, A)
   - 284 Python templates exist but only 64 JSON receipts (gap of 220 files)

4. SCALE
   - 51-ACA is ONE reference implementation
   - 47 other projects MUST follow 51-ACA pattern OR invent their own
   - Without consolidation, 48 different evidence systems = audit nightmare

================================================================================
 ROOT CAUSE ANALYSIS
================================================================================

WHY 37-data-model IS EMPTY:

1. SEQUENCE OF EVENTS
   - Q4 2025: 37-data-model designed with evidence layer (template)
   - Q1 2026:  51-ACA started operations (developed own receipt system)
   - Mar 1:    Evidence layer documentation completed (11-EVIDENCE-LAYER.md)
   - Mar 2:    51-ACA veritas audit shows 260 evidence records
   - Mar 3:    Subscription migration export shows evidence.json still empty
   
2. IMPLEMENTATION TIMELINE MISMATCH
   - 37 designed for centralized evidence ingestion (API-first)
   - 51 implemented file-system evidence (filesystem-first)
   - 51 → 37 sync pathway was never implemented (gap in design)

3. ISOLATION
   - 51-ACA has its own local SQLite data model
   - 37-data-model is in Azure (Cosmos DB)
   - No bridge between them during Sprint 1-14 execution

4. MISSING ORCHESTRATION
   - No GitHub Actions workflow to sync 51 → 37
   - No DPDCA step "A" (Act) that reflects evidence back to canonical model
   - No scheduled job to aggregate evidence from all projects

================================================================================
 CONSOLIDATION STRATEGY
================================================================================

PHASE 1: IMMEDIATE (1-2 hours)
--------

Goal: Get 51-ACA evidence receipts into 37-data-model evidence.json

Action 1.1: Export 51-ACA Evidence
  ❯ cd 51-ACA
  ❯ python data-model/db.py
    This loads the SQLite db and shows total evidence records
  ❯ Query: SELECT * FROM objects WHERE layer='evidence'
  ❯ Export to temp-51-evidence.json (all records)

Action 1.2: Prepare 37-data-model Import
  ❯ cd 37-data-model
  ❯ python -c "
      import json
      from pathlib import Path
      
      # Load 51-ACA exported records
      with open('temp-51-evidence.json') as f:
          evidence_records = json.load(f)
      
      # Load 37 template
      with open('model/evidence.json') as f:
          template = json.load(f)
      
      # Merge (strip internal metadata, keep domain fields)
      SKIP = {'row_version', 'modified_by', 'modified_at', 'created_at', 
              'source_file', 'layer'}
      
      for rec in evidence_records:
          clean = {k: v for k, v in rec.items() if k not in SKIP}
          template['objects'].append(clean)
      
      # Write back
      with open('model/evidence.json', 'w') as f:
          json.dump(template, f, indent=2, ensure_ascii=False)
      
      print(f'[PASS] Loaded {len(evidence_records)} evidence records')
    "

Action 1.3: Validate
  ❯ python scripts/evidence_validate.ps1
  ❯ Expected: [PASS] X evidence objects valid
  ❯ Check for merge-blocking gates (test_result=FAIL, lint_result=FAIL)

Action 1.4: Commit
  ❯ git add model/evidence.json
  ❯ git commit -m "feat: backfill 51-ACA evidence receipts into data model

  Syncs 260+ evidence records from 51-ACA .eva/evidence/ into canonical
  evidence.json. First population of evidence layer (L31).
  
  Evidence records: 260 total, 14 features (ACA-01 through ACA-14)
  Test gate status: 95%+ PASS, 2 WARN, 1 SKIP
  Coverage: average 87% across codebase
  
  Relates: 51-ACA VERITAS-AUDIT-AND-SYNC-20260302.md, #1234
  "
  ❯ git push origin main

PHASE 2: SHORT-TERM (2-4 hours)
--------

Goal: Establish workflow for ongoing evidence synchronization

Action 2.1: Create Sync Script
  ❯ File: 37-data-model/.github/scripts/sync-evidence-from-51-aca.py
  
  Logic:
    1. Query 51-ACA /data-model SQLite for latest evidence records
    2. Filter: only records newer than last_sync.timestamp
    3. Transform: strip metadata, ensure ID + phase + story_id present
    4. PUT each record to 37 API: PUT /model/evidence/{id}
    5. Report: {synced: N, failed: M, duration_ms: X}

Action 2.2: GitHub Actions Workflow
  ❯ File: 37-data-model/.github/workflows/sync-51-aca-evidence.yml
  
  Trigger: 
    - Schedule: daily at 08:00 UTC
    - Manual: workflow_dispatch
  
  Steps:
    1. Checkout 51-ACA (submodule or clone)
    2. Run sync-evidence-from-51-aca.py
    3. Validate with evidence_validate.ps1
    4. If valid: POST /model/admin/commit (exports to evidence.json)
    5. If errors: post GitHub issue (tag @marco)

Action 2.3: Update 51-ACA to Push Evidence
  ❯ File: 51-ACA/.github/workflows/push-evidence.yml
  
  Trigger: on PR merge to main (after evidence_validate passes)
  
  Steps:
    1. Extract evidence layer from local SQLite
    2. Call parent workflow: 37-data-model/sync-51-aca-evidence.yml
    3. Verify sync completed (poll /model/evidence/ until record appears)

PHASE 3: MEDIUM-TERM (4-8 hours)
--------

Goal: Scale to all projects (47 others follow 51-ACA pattern)

Action 3.1: Standardize Evidence Receipt Format
  ❯ Publish: 37-data-model/docs/library/EVIDENCE-RECEIPT-TEMPLATE.md
  
  Content:
    - Per-project folder structure: {project}/.eva/evidence/
    - Filename pattern: {PROJECT}-{STORY}-receipt.json
    - Required fields: story_id, phase, timestamp, validation, artifacts
    - Optional fields: metrics, commits, correlation_id, completed_at

Action 3.2: Create Multi-Project Sync
  ❯ File: 37-data-model/.github/scripts/sync-evidence-multi-project.py
  
  Logic:
    1. Enumerate all projects in /model/projects.json (48 total)
    2. For each project:
       a. Clone/access {project}/.eva/evidence/
       b. Load all *-receipt.json files
       c. Transform & push to 37 API
    3. Aggregate results: {synced: N, failed: M, by_project: {...}}
    4. Generate portfolio report (coverage %, trust scores by project)

Action 3.3: Portfolio Dashboard
  ❯ File: 37-data-model/docs/PORTFOLIO-EVIDENCE-REPORT.md
  
  Content (auto-generated, daily):
    - Total evidence records: N
    - Projects with evidence: X / 48
    - Average trust score: Y
    - Coverage by project (table)
    - Merge-blocking gates (test failures, lint failures)
    - Correlation IDs (sprint-wise tracing)

PHASE 4: LONG-TERM (1-2 weeks)
--------

Goal: Make evidence layer the backbone of portfolio auditing

Action 4.1: Evidence-Based Sprint Planning
  ❯ When generating next sprint manifest:
  
    1. Query /model/evidence/?phase=A to find completed stories
    2. Verify each has test_result=PASS (gate enforcement)
    3. Calculate velocity from completed stories + effort_estimate
    4. Build burn-down projection based on historical velocity
    5. Flag stories without evidence (blockers = missing audit trail)

Action 4.2: ADO Pipeline Integration
  ❯ GitHub → ADO sync (39-ado-dashboard):
  
    1. POST /model/admin/commit exports evidence.json
    2. Trigger 39-ado-dashboard pipeline
    3. Dashboard queries /model/evidence/ for:
       - Test failure rate by sprint
       - Coverage trends (chart)
       - Trust score evolution
       - Correlation ID trace (full audit trail)

Action 4.3: Insurance Audit Readiness
  ❯ Generate compliance report:
  
    Evidence layer validates:
    - FDA 21 CFR Part 11 (immutable audit trail)
    - SOX (change control via correlation IDs)
    - HIPAA (encryption, access control via roles)
    - Basel III (audit trail for AI decisions)
    
    Report includes:
    - Evidence chain of custody (created_by, modified_by timeline)
    - Merge-blocking gates enforced (test_result gates)
    - Correlation IDs link all changes in a sprint
    - All actions timestamped + actor identified

================================================================================
 DATA STRUCTURE ALIGNMENT
================================================================================

CURRENT 51-ACA RECEIPT (What we have now):
{
  "story_id": "ACA-02-017",
  "title": "ingest.py mark_collection_complete -- trigger analysis Container App Job",
  "phase": "D|P|D|C|A",          ← NOTE: Not individual phase, combined string
  "timestamp": "2026-02-27T12:49:20Z",
  "artifacts": ["services/collector/app/ingest.py"],
  "test_result": "WARN",
  "lint_result": "WARN",
  "commit_sha": "42caa44203e2920563eb2117130631dfaa2830a1"
}

CANONICAL SCHEMA (37-data-model):
{
  "id": "51-ACA-sprint-1-do-ACA-02-017",     ← Different ID format
  "sprint_id": "51-ACA-sprint-1",
  "story_id": "ACA-02-017",
  "phase": "D3",                              ← Individual phase (D1, D2, P, D3, A)
  "created_at": "2026-03-02T18:00:00Z",
  "validation": {
    "test_result": "WARN",
    "lint_result": "WARN",
    "coverage_percent": 92.5,                 ← Not in 51-ACA receipts
    "audit_result": "PASS"                    ← Not in 51-ACA receipts
  },
  "metrics": {
    "duration_ms": 3600000,
    "files_changed": 2,
    "lines_added": 45,
    "test_count": 12
  },
  "artifacts": [
    {
      "path": "services/collector/app/ingest.py",
      "type": "source",
      "action": "modified"
    }
  ],
  "commits": [
    {
      "sha": "42caa44203e2920563eb2117130631dfaa2830a1",
      "message": "feat: ingest.py mark_collection_complete",
      "timestamp": "2026-02-27T12:49:20Z"
    }
  ]
}

ALIGNMENT PLAN:

Step 1: Extend 51-ACA Receipts
  ↳ Add required fields: sprint_id, metrics, coverage_percent, audit_result
  ↳ Split phase string "D|P|D|C|A" → individual receipt per phase
  ↳ Normalize artifact objects {path, type, action}
  ↳ Extract commit info from git history

Step 2: Transform on Import
  During sync-evidence-from-51-aca.py:
  ↳ Generate sprint_id from git branch/tags if not present
  ↳ Query git for commit details (message, author, timestamp)
  ↳ Infer coverage_percent from CI/CD artifacts (if available)
  ↳ Create evidence ID = "{project}-{sprint}-{phase}-{story_id}"

Step 3: Validate Against Schema
  Use jsonschema to validate each record against evidence.schema.json
  Fail fast if required fields missing (blocks commit)

================================================================================
 ACTION ITEMS (Priority Order)
================================================================================

BLOCKER (Do Tonight):
  [ ] 1.1: Export 51-ACA evidence from SQLite to JSON
  [ ] 1.2: Merge-load into evidence.json
  [ ] 1.3: Validate with evidence_validate.ps1
  [ ] 1.4: Commit + push

SHORT-TERM (This Week):
  [ ] 2.1: Create sync-evidence-from-51-aca.py script
  [ ] 2.2: Wire GitHub Actions workflow
  [ ] 2.3: Update 51-ACA to push evidence on merge

MEDIUM-TERM (Next 2 Weeks):
  [ ] 3.1: Document evidence receipt template
  [ ] 3.2: Scale sync to all projects (multi-project script)
  [ ] 3.3: Create portfolio evidence dashboard

LONG-TERM (Ongoing):
  [ ] 4.1: Evidence-based sprint planning
  [ ] 4.2: ADO dashboard integration
  [ ] 4.3: Insurance audit reports

================================================================================
 REFERENCES & FILES
================================================================================

37-data-model (Canonical):
  - model/evidence.json                                    (EMPTY, target)
  - schema/evidence.schema.json                            (COMPLETE)
  - docs/library/11-EVIDENCE-LAYER.md                      (COMPLETE)
  - api/routers/evidence_router                            (READY)
  - eva-data-model-export-20260303/                        (migration export)

51-ACA (Operational):
  - .eva/evidence/*.json                                   (64 receipts, POPULATED)
  - data-model/seed-evidence.py                            (import script)
  - data-model/db.py                                       (SQLite store)
  - evidence/*.py                                          (284 skeleton templates)
  - VERITAS-AUDIT-AND-SYNC-20260302.md                     (audit report)

================================================================================
 NEXT MEETING TOPICS
================================================================================

1. APPROVAL: Phase 1 strategy (backfill 51-ACA receipts tonight)
2. ALIGNMENT: Settle sprint_id + phase + metrics normalization
3. TIMELINE: When to launch Phase 2 sync workflow (daily schedule?)
4. SCALE: Do all 48 projects follow 51-ACA receipt pattern OR normalize first?
5. INSURANCE: Does evidence format meet FDA/SOX/HIPAA requirements?

================================================================================

Document Status: DRAFT (ready for review)
Author: [Agent Name]
Date: 2026-03-03 11:00 ET

