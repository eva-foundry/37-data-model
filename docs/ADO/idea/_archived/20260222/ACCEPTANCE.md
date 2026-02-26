# EVA Data Model — Maintenance & Extension Acceptance Criteria

**Created:** 2026-02-21  
**Epic:** EVA Data Model — Maintenance & Extension Tooling

---

## Acceptance Philosophy

Root ACCEPTANCE.md tests whether an agent can answer a layer query in ≤ 3 lines.
This document tests whether the **model stays accurate without manual effort**.

> **The end-state test:** A developer merges a PR that adds a new FastAPI endpoint
> to `33-eva-brain-v2`. Within one sprint cycle, `37-data-model/model/endpoints.json`
> reflects that endpoint with no manual JSON editing — either via same-PR (developer
> did it) or via drift detection + alert (automation caught the miss).

---

## Feature 1 — CI Gate & Same-PR Enforcement

### DM-MAINT-WI-0: coverage-gaps.ps1

| # | Test | Command | Expected |
|---|------|---------|----------|
| 1 | Script exists and runs | `.\scripts\coverage-gaps.ps1` | Exits 0; outputs array |
| 2 | Requirements gap | `.\scripts\coverage-gaps.ps1 \| Where-Object { $_.kind -eq 'requirement' -and $_.test_ids.Count -eq 0 }` | Returns current untested requirements |
| 3 | Endpoint gap | `.\scripts\coverage-gaps.ps1 \| Where-Object { $_.kind -eq 'endpoint' }` | Returns endpoints with no `satisfied_by` back-ref |
| 4 | Pipeline-friendly | `.\scripts\coverage-gaps.ps1 \| Select-Object kind, id, layer` | No nulls |
| 5 | README updated | `Select-String 'coverage-gaps' README.md` | Found in scripts table |

---

### DM-MAINT-WI-1: GitHub Action — validate-model on every PR

| # | Test | How to verify | Expected |
|---|------|---------------|----------|
| 1 | Workflow triggers on model/** change | Open PR modifying `model/endpoints.json` | Workflow appears in Actions tab |
| 2 | Clean model passes | Valid endpoints.json → workflow runs | All steps green |
| 3 | Dangling reference fails | Add endpoint with `cosmos_reads: ["nonexistent_container"]` → open PR | `validate-model.ps1` step exits 1; PR blocked |
| 4 | Violation message surfaced | Same as #3 | Step output contains `DANGLING_REF` or equivalent |
| 5 | Artifact uploaded | Any PR → workflow completes | `eva-model-pr-<N>` artifact downloadable |
| 6 | Actionlint | `actionlint .github/workflows/validate-model.yml` | 0 warnings |
| 7 | Badge in README | `Select-String 'validate-model' README.md` | Badge URL present |

---

### DM-MAINT-WI-2: Same-PR enforcement

| # | Test | How to verify | Expected |
|---|------|---------------|----------|
| 1 | Script exists | `Test-Path scripts/check-same-pr.ps1` | True |
| 2 | Assembled before PR → passes | PR where `eva-model.json` mtime > `endpoints.json` mtime | `same-pr-check` job passes |
| 3 | Not assembled → fails | PR where `endpoints.json` updated but `eva-model.json` is stale | `same-pr-check` job fails with message |
| 4 | Non-model PR skipped | PR touching only `README.md` | `same-pr-check` job skipped (not triggered) |
| 5 | Script documented | `Select-String 'check-same-pr' README.md` | Found |

---

## Feature 2 — Automated Drift Detection

### DM-MAINT-WI-4: sync-from-source -OutputFormat json

| # | Test | Command | Expected |
|---|------|---------|----------|
| 1 | JSON mode outputs parseable array | `.\scripts\sync-from-source.ps1 -OutputFormat json \| ConvertFrom-Json` | No parse error |
| 2 | Each object has required fields | `... \| Select-Object object_id, layer, status, source_value, model_value` | No nulls on object_id / layer / status |
| 3 | Known SYNC item appears | Unchanged endpoint → `status -eq 'SYNC'` | 0 false positives |
| 4 | Text mode unchanged | `.\scripts\sync-from-source.ps1` (no flag) | Same human-readable output as before |
| 5 | STATUS_MISMATCH detected | Change endpoint status to deliberate wrong value → run | Output includes `STATUS_MISMATCH` entry |

---

### DM-MAINT-WI-3: Scheduled drift-detection workflow

| # | Test | How to verify | Expected |
|---|------|---------------|----------|
| 1 | Workflow trigger works | `workflow_dispatch` → manual run | Completes without error |
| 2 | Drift report uploaded | Any run | `drift-report.json` artifact present |
| 3 | ADO bug on drift | Introduce deliberate STATUS_MISMATCH → run workflow | ADO bug created within 2 minutes; tagged `eva-data-model;drift;auto` |
| 4 | No drift → no ADO bug | Clean model → run workflow | 0 new ADO WIs created |
| 5 | Graceful if no ADO_PAT | Remove `ADO_PAT` secret → run workflow | Workflow exits 0; logs "ADO_PAT not set — skipping bug creation" |
| 6 | Schedule fire | Wait for Monday 06:00 UTC or validate cron expression via `cron-descriptor` tool | `0 6 * * 1` = "At 06:00 on Monday" |

---

### DM-MAINT-WI-5: Wire coverage-gaps into drift workflow

| # | Test | How to verify | Expected |
|---|------|---------------|----------|
| 1 | coverage-report.json uploaded | Any workflow run | Artifact present |
| 2 | ADO WI on zero-coverage requirement | Requirement with empty `test_ids` → run workflow | ADO bug `[COVERAGE] <id> — no test coverage` created |
| 3 | No gap → no WI | All requirements have test_ids → run workflow | 0 coverage WIs created |

---

## Feature 4 — Model-Sync Agent

### DM-MAINT-WI-6: model-sync-agent scaffold

| # | Test | Request | Expected |
|---|------|---------|----------|
| 1 | POST returns valid patch | `POST /agents/model-sync-agent/invoke` with new endpoint object | `{ "patch": [...], "validate_command": "...", "pr_title": "..." }` |
| 2 | Patch applies cleanly | Apply returned patch to `model/endpoints.json` | `validate-model.ps1` exits 0 |
| 3 | Model configurable | Set `FOUNDRY_MODEL_DEPLOYMENT_NAME=gpt-4.1` → restart → POST | Agent uses specified model (visible in tracing) |
| 4 | Agent registered in model | `$m.agents \| Where-Object { $_.id -eq 'model-sync-agent' }` | Found with `input_type`, `output_type`, `llm_deployment` fields populated |
| 5 | Unsupported layer rejected | `POST { layer: "nonexistent" }` | `422 Unprocessable Entity` with clear message |

---

### DM-MAINT-WI-7: Integrate into sprint-execute.yml Do phase

| # | Test | Scenario | Expected |
|---|------|----------|----------|
| 1 | Auto-patch raised | WI tagged `same-pr-required:37-data-model` completes Do phase | PR opened on `37-data-model` with JSON patch |
| 2 | CI on patch PR passes | PR from step 1 → `validate-model.yml` runs | All steps green |
| 3 | No extra label → no auto-patch | WI without `same-pr-required:37-data-model` | No `37-data-model` PR created |
| 4 | Patch PR description references source WI | Review opened PR | Body contains `resolves #<source-wi-id>` |

---

## Epic End-State Gate

All 8 stories Done when:

```powershell
# 1. CI gate is live
gh api repos/eva-foundry/37-data-model/actions/workflows --jq '.workflows[].name' |
  Select-String 'validate-model'
# → "validate-model"

# 2. Coverage gaps visible
.\scripts\coverage-gaps.ps1 | Measure-Object
# → exits 0, Count ≥ 0

# 3. Drift detection scheduled
gh api repos/eva-foundry/37-data-model/actions/workflows --jq '.workflows[].name' |
  Select-String 'drift-detection'
# → "drift-detection"

# 4. Model-sync agent registered
$m = Get-Content model/eva-model.json | ConvertFrom-Json
$m.agents | Where-Object { $_.id -eq 'model-sync-agent' }
# → non-empty

# 5. validate-model.ps1 still exits 0 (no regression)
.\scripts\assemble-model.ps1; .\scripts\validate-model.ps1
# → exit 0
```

No regression is an acceptance requirement: adding maintenance tooling must NOT
break the 11/11 layer completeness status.
