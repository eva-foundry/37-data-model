# Skill: sprint-advance
# EVA-STORY: F37-DPDCA-001

**Version**: 1.0.0
**Project**: 37-data-model
**Triggers**: sprint 2, sprint 3, next sprint, deliver next sprint, advance sprint, sprint planning,
  sprint handoff, close sprint, begin sprint, plan next sprint, sprint NNN, fk enhancement sprint

---

## PURPOSE

This skill owns the complete sprint-advance workflow for 37-data-model (EVA Data Model).
It runs every time a completed sprint needs to be closed and the next sprint needs to be planned.

The workflow has five phases run in strict order:

```
PHASE 1 -- Validate prior sprint evidence (veritas + pytest + model validation)
PHASE 2 -- Audit repo and data model (coverage, consistency, WBS integrity)
PHASE 3 -- Update data model + export to Cosmos (mark done stories, commit)
PHASE 4 -- Determine next sprint story set (archaeology + undone dump + sizing)
PHASE 5 -- Deliver sprint manifest and GitHub issue
```

Never skip a phase. Never start Phase 4 before Phase 2 is clean.

---

## PHASE 1 -- VALIDATE PRIOR SPRINT EVIDENCE

### 1.1 Run pytest gate

```powershell
Set-Location C:\eva-foundry\37-data-model
C:\eva-foundry\.venv\Scripts\python.exe -m pytest tests/ -x -q --tb=short 2>&1
# REQUIRED: exits 0.  If non-zero: fix failures BEFORE advancing.
```

Record the test count. Write to STATUS.md under "Test count: N passing."

### 1.2 Run veritas full audit

```powershell
$repo = "C:\eva-foundry\37-data-model"
node C:\eva-foundry\48-eva-veritas\src\cli.js audit --repo $repo --warn-only 2>&1 |
    Tee-Object "$repo\veritas-audit-out.txt" | Select-Object -Last 30
Write-Host AUDIT_DONE
```

Read the gap list from the output. For each `missing_implementation` or
`missing_evidence` gap tied to a story claimed done in PLAN.md:

| Gap type on a DONE story | Mandatory fix |
|---|---|
| `missing_implementation` | Add `# EVA-STORY: F37-NN-NNN` to the relevant source file |
| `missing_evidence` | Add `# EVA-STORY: F37-NN-NNN` to a file under `tests/` for that story |
| `orphan_artifact` | The tag in source does NOT match any plan story -- remove or fix the ID |

Fix all gaps tied to stories that are marked `Status: DONE` in PLAN.md before
continuing. Gaps for NOT-YET-STARTED stories are acceptable at this stage.

### 1.3 Check MTI is at or above gate threshold

```powershell
$t = Get-Content "$repo\.eva\trust.json" | ConvertFrom-Json
Write-Host "MTI: $($t.mti)   Actions: $($t.actions -join '|')"
# Gate: MTI >= 95 (37-data-model is foundational -- higher bar than apps)
# If MTI < gate: fix tags/evidence before Phase 2
```

Record MTI in STATUS.md.

### 1.4 Run model validation gate (37-data-model specific)

```powershell
$base = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io"
$v = Invoke-RestMethod "$base/model/admin/validate" -Headers @{"Authorization"="Bearer dev-admin"}
Write-Host "violations=$($v.count)"
# REQUIRED: validation count = 0. Fix all cross-reference violations before advancing.
```

---

## PHASE 2 -- AUDIT REPO AND DATA MODEL

### 2.1 Verify data model server is running

```powershell
$base = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io"
$h = Invoke-RestMethod "$base/health" -ErrorAction SilentlyContinue
# Fallback to local if ACA is down (rare)
if (-not $h) {
    $base = "http://localhost:8010"
    $h = Invoke-RestMethod "$base/health" -ErrorAction SilentlyContinue
    if (-not $h) {
        $env:PYTHONPATH = "C:\eva-foundry\37-data-model"
        Start-Process "C:\eva-foundry\.venv\Scripts\python.exe" `
            "-m uvicorn api.server:app --port 8010 --reload" -WindowStyle Hidden
        Start-Sleep 4
    }
}
Write-Host "store=$($h.store)  version=$($h.version)"
```

### 2.2 Check total objects in model matches expectations

```powershell
$s = Invoke-RestMethod "$base/model/agent-summary"
Write-Host "total=$($s.total)"
# Expected baseline: 4061+ objects (31 layers)
# If total is lower than last known baseline (see STATUS.md): investigate before continuing
```

### 2.3 Run veritas-plan story dump -- find all undone stories

```powershell
$vp = Get-Content C:\eva-foundry\37-data-model\.eva\veritas-plan.json | ConvertFrom-Json
foreach ($feat in $vp.features) {
    $undone = $feat.stories | Where-Object { -not $_.done }
    if ($undone) {
        Write-Host "=== $($feat.id) $($feat.title) -- $($undone.Count) undone"
        foreach ($s in $undone | Select-Object -First 8) {
            Write-Host "  [ ] $($s.id)  $($s.title)"
        }
    }
}
Write-Host UNDONE_DUMP_DONE
```

Save this output -- it is the candidate pool for Phase 4.

### 2.4 Code archaeology on prior-sprint fixes

For every story that was due in the prior sprint but is not yet marked `done=True`
in veritas-plan.json, check whether the code fix actually already exists:

```powershell
# Example -- check if validation fix already present
Select-String -Path api\validation.py -Pattern "validate_endpoint_references"
# Example -- check if relationship schema exists
Select-String -Path schema\relationship.schema.json -Pattern "edge_type"
```

If the code is already correct: the story needs only a tag + unit test + `Status: DONE`
in PLAN.md. Mark these as XS stories in the next sprint. Do NOT reimplement them.

### 2.5 Run model violation check

```powershell
$c = Invoke-RestMethod "$base/model/admin/validate" -Headers @{"Authorization"="Bearer dev-admin"}
Write-Host "violations=$($c.count)"
# 37-data-model target: 0 violations. Fix any before committing model changes.
```

---

## PHASE 3 -- UPDATE DATA MODEL AND EXPORT TO COSMOS

### 3.1 Mark completed stories done=True in PLAN.md

For every story confirmed done (code + tag + test + validation passing):

```
Find the PLAN.md story block (search for the story title or WBS number).
Add "Status: DONE" on the line after the story title block header.
```

Then reseed:

```powershell
C:\eva-foundry\.venv\Scripts\python.exe scripts/seed-from-plan.py --reseed-model
C:\eva-foundry\.venv\Scripts\python.exe scripts/reflect-ids.py
```

Verify the count increased:

```powershell
$vp = Get-Content .eva\veritas-plan.json | ConvertFrom-Json
$done = ($vp.features.stories | Where-Object { $_.done }).Count
Write-Host "done=$done  total=$($vp.features.stories.Count)"
```

### 3.2 Update data model endpoint/layer records for completed stories

For each completed story that touches an API endpoint or layer record:

```powershell
# Write a temp script -- NEVER inline PUT (Rule 6 from copilot-instructions)
$script = @'
$base = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io"
$ep = Invoke-RestMethod "$base/model/endpoints/GET /model/relationships/"
$prev_rv = $ep.row_version
$ep.status = "implemented"
$ep.implemented_in = "api/routers/relationships.py"
$ep.repo_line = 42
$body = $ep |
    Select-Object * -ExcludeProperty layer,modified_by,modified_at,created_by,created_at,row_version,source_file |
    ConvertTo-Json -Depth 10
$p = @{ Method="PUT"; ContentType="application/json"; Body=$body; Headers=@{"X-Actor"="agent:copilot"} }
Invoke-RestMethod "$base/model/endpoints/GET /model/relationships/" @p
$w = Invoke-RestMethod "$base/model/endpoints/GET /model/relationships/"
Write-Host "rv=$($w.row_version) expected=$($prev_rv+1) status=$($w.status)"
'@
$script | Set-Content "$env:TEMP\put-ep.ps1" -Encoding UTF8
pwsh -NoProfile -File "$env:TEMP\put-ep.ps1"
```

### 3.3 Export to Cosmos (37-data-model critical step)

```powershell
$c = Invoke-RestMethod "$base/model/admin/commit" `
    -Method POST -Headers @{"Authorization"="Bearer dev-admin"}
# ACA PASS conditions: violation_count=0 AND exported_total matches agent-summary.total
Write-Host "violations=$($c.violation_count)  exported=$($c.exported_total)  errors=$($c.export_errors.Count)"
# Note: ACA returns assemble.stderr="Script not found" -- this is expected, ignore if violation_count=0
```

---

## PHASE 4 -- DETERMINE NEXT SPRINT STORY SET

### 4.1 Selection criteria for FK Enhancement (apply in order)

1. **Phase sequence**: Follow FK Enhancement execution plan phase order (Phase 0 -> 1A -> 1B-1F -> 2-6)
2. **Blockers first**: any story with dependencies now unblocked by Phase 3 changes
3. **Foundation third**: stories whose completion unblocks the most other stories
4. **Size budget**: FK sprints = variable (48h-80h), sized by FP from execution plan

### 4.2 Story sizing guide (FK Enhancement specific)

| Size | FP | Criteria |
|---|---|---|
| XS | 0.5-1 | Validation only, schema update, docs update |
| S | 1-1.5 | Single router, stub implementation, seed data |
| M | 2-3 | Full CRUD router + tests, store adapter, migration script |
| L | 3-5 | Complex logic (saga merge, BFS, cascade engine), multi-file |

### 4.3 Model rationale rules

| Story type | Model | Why |
|---|---|---|
| XS (validation, docs) | gpt-4o-mini | No cross-file reasoning |
| S (stub router, seed) | gpt-4o-mini | Simple, single-file |
| M (CRUD, tests) | gpt-4o | Cross-file reasoning, test patterns |
| L (saga, BFS, cascade) | gpt-4o | Complex algorithms, security-critical |

Never use gpt-4o-mini for: saga merge, cascade engine, graph traversal, Cosmos writes.

### 4.4 Run the manifest generator

```powershell
Set-Location C:\eva-foundry\37-data-model

# List undone stories to confirm final selection
C:\eva-foundry\.venv\Scripts\python.exe scripts/gen-sprint-manifest.py --list-undone

# Generate the manifest (replace with actual story IDs for next FK sprint)
C:\eva-foundry\.venv\Scripts\python.exe scripts/gen-sprint-manifest.py `
    --sprint 01 `
    --name "fk-phase1a-store" `
    --stories F37-FK-101,F37-FK-102,F37-FK-103,F37-FK-104 `
    --sizes F37-FK-101=L,F37-FK-102=M,F37-FK-103=M,F37-FK-104=S
# Output: .github/sprints/sprint-01-fk-phase1a-store.md  (with TODO placeholders)
```

---

## PHASE 5 -- DELIVER SPRINT MANIFEST AND GITHUB ISSUE

### 5.1 Fill the manifest TODO fields

Open `.github/sprints/sprint-NN-<name>.md`. For each story block, replace every
`TODO:` field with the content specified below.

#### `model_rationale` field
State which model and why in one sentence.
Example: `"gpt-4o: RelationshipMeta schema requires cross-file validation with AbstractStore interface."`

#### `files_to_create` field
List every file path that the sprint agent must create or modify:
- Exact repo-relative paths
- Include test files (`tests/test_F37-FK-NNN_<name>.py`)
- Include schema files (`schema/relationship.schema.json`)

#### `acceptance` field
List 4-6 bullet points:
- Source file has `# EVA-STORY: F37-FK-NNN` tag (always first)
- Functional behaviour assertion (what the code does)
- Test file name + specific test function name that must pass
- `pytest tests/test_<name>.py exits 0` (always last)
- Model validation passes: `POST /model/admin/validate` returns count=0

#### `implementation_notes` field
Write 5-8 sentences of precise technical guidance:
- Import paths the agent must use
- Class/function signatures if introducing new files
- Mock patterns for Cosmos calls
- EVA-STORY tag placement: functional line, not blank comment block
- FK Enhancement context: cite FK-ENHANCEMENT-COMPLETE-PLAN sections
- Opus 4.6 fixes: if relevant (saga, BFS, separate container)

### 5.2 Manifest content rules

The manifest HTML comment header must use this JSON schema:

```json
{
  "sprint_id": "SPRINT-NN",
  "sprint_title": "fk-phaseXX-name",
  "target_branch": "sprint/NN-fk-phaseXX-name",
  "epic": "F37-FK",
  "stories": [
    {
      "id": "F37-FK-NNN",
      "title": "exact title from execution plan",
      "size": "XS|S|M|L",
      "model": "gpt-4o|gpt-4o-mini",
      "model_rationale": "one sentence",
      "files_to_create": ["repo-relative/path.py"],
      "acceptance": ["criterion 1", "criterion 2"],
      "implementation_notes": "paragraph of technical guidance"
    }
  ]
}
```

### 5.3 Verify story IDs are canonical

All story IDs come from `.eva/veritas-plan.json`. Never invent an ID.

```powershell
$vp = Get-Content .eva\veritas-plan.json | ConvertFrom-Json
# Confirm each story ID in the manifest exists
foreach ($id in @("F37-FK-001","F37-FK-002","F37-FK-003")) {
    $found = $vp.features.stories | Where-Object { $_.id -eq $id }
    if (-not $found) { Write-Host "ERROR -- ID not in plan: $id" }
    else { Write-Host "OK: $id -- $($found.title)" }
}
```

### 5.4 Create the GitHub issue

```powershell
Set-Location C:\eva-foundry\37-data-model
gh issue create `
    --repo eva-foundry/37-data-model `
    --title "[SPRINT-NN] fk-phaseXX-name" `
    --body-file .github/sprints/sprint-NN-fk-phaseXX-name.md `
    --label "sprint-task"
# Record the issue number from the output URL
```

If the `sprint-task` label does not exist yet:

```powershell
gh label create "sprint-task" --repo eva-foundry/37-data-model --color "0075ca" `
    --description "Sprint execution issue for the sprint-agent workflow"
```

---

## PHASE 5+ -- CLOSE THE LOOP

### After issue is created, before any other work:

```powershell
Set-Location C:\eva-foundry\37-data-model

# 1. Commit the manifest file
git add .github/sprints/sprint-NN-<name>.md
git commit -m "chore(F37-FK-NNN): Sprint-NN manifest fully filled -- N stories, issue #NN"
git push origin main

# 2. Update STATUS.md
#    - Version: 1.N.0
#    - Updated: date + "Sprint-NN issue #NN created"
#    - List all sprint stories with [PLANNED] prefix
#    - Record test count, MTI, validation count

# 3. Commit STATUS.md
git add STATUS.md
git commit -m "chore(F37-FK-NNN): STATUS.md vN.N.0 -- Sprint-NN issue #NN created"
git push origin main
```

---

## FK ENHANCEMENT QUICK REFERENCE

### Phase 0 -- Server-Side Validation (Sprint 0, 48h, 3 stories, 5 FP)
- F37-FK-001: Implement string-array validator (M, 2 FP)
- F37-FK-002: Integrate validator into PUT routers (XS, 1 FP)
- F37-FK-003: Backfill validation + reporting (M, 2 FP)

### Phase 1A -- Store Interface + Schema (Sprint 1, 80h, 8 stories, 13 FP)
- F37-FK-101: Define RelationshipMeta schema (L, 5 FP)
- F37-FK-102: Extend AbstractStore interface (M, 3 FP)
- F37-FK-103: Implement MemoryStore adapter (M, 2 FP)
- F37-FK-104 through F37-FK-108: Router stubs, seed data, docs, validation

See [FK-ENHANCEMENT-EXECUTION-PLAN-2026-03-01.md](../docs/FK-ENHANCEMENT-EXECUTION-PLAN-2026-03-01.md) for complete 12-sprint breakdown.

---

## COMMON PITFALLS

| Pitfall | Symptom | Fix |
|---|---|---|
| Story IDs invented from memory | Veritas returns orphan artifacts | Always read from .eva/veritas-plan.json |
| Tag on wrong file type | Coverage does not increase after tag | Check file extension is .py/.json |
| `done=True` without validation passing | Model violations block next sprint | Always run `POST /model/admin/validate` |
| Inline PowerShell PUT with JSON | 422 or silent wrong value | Always write to temp .ps1 file, run with -File |
| Missing row_version capture | PUT succeeds but confirm fails | Capture $prev_rv BEFORE mutating object |
| Cosmos export skipped | ACA not updated with local changes | Always run `POST /model/admin/commit` in Phase 3 |
| MTI below 95 | Sprint cannot advance | Fix tags/evidence, never lower the gate for 37-data-model |

---

## QUICK COMMAND REFERENCE

```powershell
# Run full audit
node C:\eva-foundry\48-eva-veritas\src\cli.js audit --repo C:\eva-foundry\37-data-model --warn-only

# Check MTI
(Get-Content C:\eva-foundry\37-data-model\.eva\trust.json | ConvertFrom-Json).mti

# List undone stories grouped by epic
$vp = Get-Content C:\eva-foundry\37-data-model\.eva\veritas-plan.json | ConvertFrom-Json
foreach ($f in $vp.features) {
    $u = $f.stories | Where-Object { -not $_.done }
    if ($u) { Write-Host "$($f.id): $($u.Count) undone" }
}

# Reseed after PLAN.md change
C:\eva-foundry\.venv\Scripts\python.exe scripts/seed-from-plan.py --reseed-model

# Reflect IDs into PLAN.md
C:\eva-foundry\.venv\Scripts\python.exe scripts/reflect-ids.py

# Generate sprint manifest
C:\eva-foundry\.venv\Scripts\python.exe scripts/gen-sprint-manifest.py --sprint NN --name "name" `
    --stories F37-FK-NNN,F37-FK-NNN

# Create GitHub issue
gh issue create --repo eva-foundry/37-data-model --title "[SPRINT-NN] name" `
    --body-file .github/sprints/sprint-NN-name.md --label "sprint-task"

# Data model health
$base = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io"
Invoke-RestMethod "$base/health"
Invoke-RestMethod "$base/model/agent-summary" | Select-Object total

# Model validation
Invoke-RestMethod "$base/model/admin/validate" -Headers @{"Authorization"="Bearer dev-admin"}

# Cosmos export
Invoke-RestMethod "$base/model/admin/commit" -Method POST -Headers @{"Authorization"="Bearer dev-admin"}
```
