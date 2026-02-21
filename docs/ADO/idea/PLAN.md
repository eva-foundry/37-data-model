# EVA Data Model — Maintenance & Extension Plan

**Created:** 2026-02-21  
**Sprint assignment:** Sprint-8 (F1–F3) · Sprint-9 (F4)  
**Status:** Idea  
**Epic:** EVA Data Model — Maintenance & Extension Tooling

---

## Feature 1 — CI Gate & Same-PR Enforcement (Sprint-8)

**Goal:** validate-model.ps1 runs automatically on every PR that touches model/**
or any source file listed in the same-PR rule table. A green badge is required
before merge. No human reminder needed.

---

### [DM-MAINT-WI-0] coverage-gaps.ps1 — requirements with zero test coverage

**Sprint assignment:** Sprint-8  
**Story points:** 1

**Description:**  
PLAN.md Sprint 5 has `[ ] scripts/coverage-gaps.ps1` as planned but unbuilt.
Write the script. It reads `eva-model.json` and outputs two lists:
1. Requirements where `test_ids` is empty or missing
2. Endpoints where no requirement in `requirements.json` lists them in `satisfied_by`

Output must be PowerShell objects (pipeline-friendly), not plain text.

**Acceptance Criteria:**
- `.\scripts\coverage-gaps.ps1` exits 0 when run from repo root
- `.\scripts\coverage-gaps.ps1 | Where-Object { $_.kind -eq 'requirement' }` returns all
  requirements with zero test_ids
- `.\scripts\coverage-gaps.ps1 | Where-Object { $_.kind -eq 'endpoint' }` returns all
  endpoints with no satisfied_by back-reference
- Script is listed in README.md scripts table

---

### [DM-MAINT-WI-1] GitHub Action — validate-model on every PR

**Sprint assignment:** Sprint-8  
**Story points:** 2

**Description:**  
Create `.github/workflows/validate-model.yml`. Triggers on `pull_request` paths:
`model/**`, `schema/**`, `scripts/**`. Steps:

1. Checkout
2. `pwsh scripts/assemble-model.ps1`
3. `pwsh scripts/validate-model.ps1` — step fails if exit code ≠ 0
4. Upload `model/eva-model.json` as an artifact named `eva-model-pr-<PR_NUMBER>`

The action runs on `ubuntu-latest` using `pwsh` (PowerShell Core, pre-installed on GitHub runners).

**Acceptance Criteria:**
- Push any PR that modifies `model/endpoints.json` → workflow runs and passes
- Introduce a deliberate dangling reference to `model/endpoints.json` → workflow fails
  and reports the violation in the step output
- Workflow file passes `actionlint` with zero warnings
- Badge added to README.md

---

### [DM-MAINT-WI-2] Same-PR enforcement — source change without model update = blocking comment

**Sprint assignment:** Sprint-8  
**Story points:** 2

**Description:**  
Extend `validate-model.yml` with a second job: `same-pr-check`. It runs only when
a PR modifies files in source repos (simulated here as committed JSON patches from
33-eva-brain-v2, 31-eva-faces, etc.). For `37-data-model` itself, the check is:

- If `git diff --name-only origin/main` includes any file under `model/` or `schema/`,
  then `scripts/validate-model.ps1` MUST have been updated to reference the new object.
- If the diff does NOT call assemble before validate, the check fails.

Implementation: add a `scripts/check-same-pr.ps1` that diffs HEAD vs base branch,
identifies layer files touched, and cross-references that `assemble-model.ps1` was
run (i.e., `eva-model.json` has a newer mtime than all source JSON files). Exit 1 if not.

**Acceptance Criteria:**
- PR that updates `model/endpoints.json` but does not re-run assemble → `same-pr-check` fails
- PR that updates `model/endpoints.json` and re-runs assemble → `same-pr-check` passes
- `check-same-pr.ps1` documented in README.md scripts table

---

## Feature 2 — Automated Drift Detection (Sprint-8)

**Goal:** Weekly scheduled workflow runs sync-from-source.ps1 against the mounted
source repos and opens an ADO bug for every `IN_SOURCE_ONLY` or `STATUS_MISMATCH`
finding. Sprint-close review becomes a triage of auto-opened bugs, not a manual grep.

---

### [DM-MAINT-WI-3] Scheduled sync-from-source workflow

**Sprint assignment:** Sprint-8  
**Story points:** 3

**Description:**  
Create `.github/workflows/drift-detection.yml`. Trigger: `schedule: cron: '0 6 * * 1'`
(Mondays 06:00 UTC) + `workflow_dispatch`.

Steps:
1. Checkout `37-data-model`
2. Checkout companion repos (`33-eva-brain-v2`, `31-eva-faces`) into `../` siblings
3. `pwsh scripts/sync-from-source.ps1 -OutputFormat json > drift-report.json`
4. Parse `drift-report.json`; for each entry where `.status != 'SYNC'`:
   - Call ADO REST API (`POST workitems/$Bug`) with title = `[DRIFT] <object_id> — <status>`
   - Tag: `eva-data-model;drift;auto`
5. Upload `drift-report.json` as workflow artifact

`sync-from-source.ps1` already exists; it needs a `-OutputFormat json` flag added
(currently prints human-readable text).

**Acceptance Criteria:**
- Run workflow on a branch where one endpoint's status is deliberately wrong
  → ADO bug created within 2 minutes
- `drift-report.json` artifact uploaded with parseable JSON content
- `sync-from-source.ps1 -OutputFormat json` outputs an array of objects with fields:
  `{ object_id, layer, status, source_value, model_value }`
- Workflow skips ADO call if `ADO_PAT` secret is not set (graceful degradation)

---

### [DM-MAINT-WI-4] sync-from-source.ps1 — add JSON output mode

**Sprint assignment:** Sprint-8  
**Story points:** 1

**Description:**  
The existing `sync-from-source.ps1` prints human-readable text.
Add a `-OutputFormat` parameter: `text` (default, existing behaviour) or `json`
(outputs a JSON array of drift objects). This is the prerequisite for DM-MAINT-WI-3.

**Acceptance Criteria:**
- `.\scripts\sync-from-source.ps1 -OutputFormat json | ConvertFrom-Json` parses without error
- Each output object has: `object_id`, `layer`, `status` (IN_MODEL_ONLY / IN_SOURCE_ONLY /
  STATUS_MISMATCH / FIELD_DRIFT / SYNC), `source_value`, `model_value`
- Default behaviour (`-OutputFormat text`) unchanged — no regression

---

## Feature 3 — Coverage Gaps Surface (Sprint-8)

Coverage-gaps.ps1 is captured in DM-MAINT-WI-0 (Feature 1, same sprint).
Feature 3 adds one additional story: wiring the output into the drift workflow.

---

### [DM-MAINT-WI-5] Wire coverage-gaps.ps1 into drift-detection workflow

**Sprint assignment:** Sprint-8  
**Story points:** 1

**Description:**  
Add a third step to `drift-detection.yml` after sync-from-source:
run `coverage-gaps.ps1 -OutputFormat json > coverage-report.json`.
For each requirement with zero test_ids, open an ADO work item:
`[COVERAGE] <requirement_id> — no test coverage`

**Acceptance Criteria:**
- Requirement with zero `test_ids` in `requirements.json` → ADO WI created on next workflow run
- If no coverage gaps exist, no WIs created and workflow exits 0
- `coverage-report.json` uploaded as artifact

---

## Feature 4 — Model-Sync Agent (Sprint-9)

**Goal:** When `29-foundry` session-workflow-agent completes the Do phase for a
`33-eva-brain-v2` WI that adds a new endpoint, it can POST to the model-sync-agent
with a structured diff. The agent proposes the JSON patch, the human reviews, and the
PR is raised automatically. Zero manual JSON editing for routine endpoint additions.

---

### [DM-MAINT-WI-6] model-sync-agent scaffold

**Sprint assignment:** Sprint-9  
**Story points:** 3

**Description:**  
New agent in `31-eva-faces/agent-fleet/app/agents/model_sync_agent.py` (or in a new
`37-data-model/agent/` directory — to be decided at design time).

Input: `{ source_repo, layer, operation, object }` where `object` is the new/changed
entity in the same shape as the target JSON layer.

Output: `{ patch: [{ op, path, value }], validate_command, pr_title, pr_body }`

Uses Foundry model (`gpt-4.1` or equivalent). Prompt instructs model to:
1. Load current layer JSON
2. Produce a RFC 6902 JSON Patch
3. Output the patch + a PowerShell validation command

**Acceptance Criteria:**
- POST `{ source_repo: "33-eva-brain-v2", layer: "endpoints", operation: "add", object: { ... } }`
  → response contains valid RFC 6902 patch that, when applied to `endpoints.json`,
  passes `validate-model.ps1`
- Model is configurable via `FOUNDRY_MODEL_DEPLOYMENT_NAME` env var
- Agent registered in `model/agents.json` with Sprint-9 target

---

### [DM-MAINT-WI-7] Integrate model-sync-agent into sprint-execute.yml Do phase

**Sprint assignment:** Sprint-9  
**Story points:** 2

**Description:**  
When `sprint-execute.yml` labels a WI with `same-pr-required:37-data-model`, the
Do phase for the source repo includes a POST to the model-sync-agent. The agent
returns a patch. The Do phase applies the patch and opens a PR on `37-data-model`.
The Act phase for `37-data-model` is then triggered by that PR's CI (DM-MAINT-WI-1).

This requires a new `tool: model-sync` in `29-foundry` skill registry.

**Acceptance Criteria:**
- WI tagged `same-pr-required:37-data-model` in `33-eva-brain-v2` → Do phase
  auto-patches `model/endpoints.json` and raises a `37-data-model` PR
- `validate-model.yml` runs on that PR and passes
- No human needed to write the JSON patch

---

## Summary Table

| Story ID | Title | Feature | Sprint | Points |
|----------|-------|---------|--------|--------|
| DM-MAINT-WI-0 | coverage-gaps.ps1 | F1+F3 | Sprint-8 | 1 |
| DM-MAINT-WI-1 | GitHub Action — validate-model on PR | F1 | Sprint-8 | 2 |
| DM-MAINT-WI-2 | Same-PR enforcement check | F1 | Sprint-8 | 2 |
| DM-MAINT-WI-3 | Scheduled drift-detection workflow | F2 | Sprint-8 | 3 |
| DM-MAINT-WI-4 | sync-from-source -OutputFormat json | F2 | Sprint-8 | 1 |
| DM-MAINT-WI-5 | Wire coverage-gaps into drift workflow | F3 | Sprint-8 | 1 |
| DM-MAINT-WI-6 | model-sync-agent scaffold | F4 | Sprint-9 | 3 |
| DM-MAINT-WI-7 | Integrate model-sync into sprint-execute | F4 | Sprint-9 | 2 |

**Sprint-8 total:** 10 points  
**Sprint-9 total:** 5 points
