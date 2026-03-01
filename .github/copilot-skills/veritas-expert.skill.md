# Skill: veritas-expert
# EVA-STORY: F37-DPDCA-002

**Version**: 1.0.0
**Project**: 37-data-model
**Triggers**: veritas trust, MTI score, evidence completeness, coverage check, veritas audit,
  trust score, evidence gaps, missing evidence, gap remediation, veritas report

---

## PURPOSE

This skill owns all EVA Veritas integration tasks for 37-data-model. Use it when:
- Computing or interpreting MTI (Marco Traceability Index) scores
- Understanding evidence sources (Source A/B/C)
- Remediating gaps (missing_implementation, missing_evidence, orphan_story_tag)
- Running full audits for sprint advancement
- Interpreting `.eva/trust.json` structure

**MTI Formula**: `coverage*0.50 + evidenceCompleteness*0.20 + consistency*0.30`

**37-data-model Gate**: MTI >= 95 (higher than app projects -- data model is foundational)

---

## EVIDENCE SOURCES

### Source A -- Coverage (50% weight)

**Definition**: Source file tags. Files with `# EVA-STORY: F37-NN-NNN` in first 15 lines.

**File types**: .py, .json, .yaml, .md (functional files only -- not test files)

**Rules**:
- Tag must be on a functional line (class def, function def, route decorator)
- NO tags in blank comment blocks (veritas discards these)
- Tag format EXACT: `# EVA-STORY: F37-NN-NNN` (for Python) or `<!-- EVA-STORY: F37-NN-NNN -->` (Markdown)

**Where to add**:
```python
# EVA-STORY: F37-FK-001
def validate_endpoint_references(obj: dict) -> bool:
    """Validator for cross-reference integrity."""
    ...
```

### Source B -- Evidence Completeness (20% weight)

**Definition**: Artifacts that prove story implementation. One of:
1. Test file with EVA-STORY tag (`tests/test_F37-FK-NNN_<name>.py`)
2. Evidence receipt file (`.eva/evidence/F37-NN-NNN-receipt.py`)
3. Git commit message containing the story ID

**Preferred method**: Test file with tag (covers both functional tag AND evidence)

**Evidence receipt format** (use when no test exists):
```python
# .eva/evidence/F37-FK-001-receipt.py
# EVA-STORY: F37-FK-001
metadata = {
    "story_id": "F37-FK-001",
    "title": "Implement string-array validator",
    "epic": "F37-FK",
    "implemented_by": "agent:copilot",
    "completed": "2026-03-08",
    "evidence": [
        "api/validation.py line 42 -- validate_endpoint_references function",
        "tests/test_F37-FK-001_validation.py -- 3 test cases",
        "POST /model/admin/validate returns count=0"
    ],
    "acceptance": "All reference fields validated, no cross-reference violations",
    "notes": "Opus REC-1 fix: string-array validation for cross-refs"
}
```

### Source C -- Consistency (30% weight)

**Definition**: STATUS.md declarations match artifact counts.

**Measured by**:
- STATUS.md declares "N stories implemented" -- veritas counts tags
- STATUS.md declares "Test count: N" -- veritas counts test files
- Discrepancy > 5% drops consistency score

**Fix**: After every sprint advance, update STATUS.md with exact counts from:
```powershell
$vp = Get-Content .eva\veritas-plan.json | ConvertFrom-Json
$done = ($vp.features.stories | Where-Object { $_.done }).Count
$total = $vp.features.stories.Count
Write-Host "Stories: $done / $total"
```

---

## GAP TYPES

### 1. missing_implementation

**Meaning**: Story is marked `Status: DONE` in PLAN.md, but NO source file has the EVA-STORY tag.

**Fix**: Add `# EVA-STORY: F37-NN-NNN` tag to the functional file (api/, schema/, scripts/)

**Example**:
```powershell
# Gap: F37-FK-001 missing_implementation
# Fix: Edit api/validation.py, add tag on line 42 (validate_endpoint_references function)
```

### 2. missing_evidence

**Meaning**: Story is marked `Status: DONE` in PLAN.md, has source tags (Source A), but NO test file or receipt (Source B).

**Fix**: Add `# EVA-STORY: F37-NN-NNN` tag to test file OR create evidence receipt

**Example**:
```powershell
# Gap: F37-FK-001 missing_evidence
# Fix: Create tests/test_F37-FK-001_validation.py with EVA-STORY tag
```

### 3. orphan_story_tag

**Meaning**: A source file has an EVA-STORY tag with ID that does NOT exist in `.eva/veritas-plan.json`.

**Fix**: Either remove the tag (typo) OR correct the ID to match a real story from PLAN.md

**Example**:
```powershell
# Gap: orphan tag ACA-99-999 in api/validation.py
# Cause: Old ID not in plan, or typo
# Fix: Change to correct ID (e.g. F37-FK-001) or remove tag
```

---

## DPDCA COMMANDS

### discover
```powershell
node C:\AICOE\eva-foundry\48-eva-veritas\src\cli.js discover --repo C:\AICOE\eva-foundry\37-data-model
# Output: .eva/artifacts.json (all EVA-STORY tags found in source)
```

### reconcile
```powershell
node C:\AICOE\eva-foundry\48-eva-veritas\src\cli.js reconcile --repo C:\AICOE\eva-foundry\37-data-model
# Output: .eva/reconciliation.json (gap list with remediation actions)
```

### compute-trust
```powershell
node C:\AICOE\eva-foundry\48-eva-veritas\src\cli.js compute-trust --repo C:\AICOE\eva-foundry\37-data-model
# Output: .eva/trust.json (MTI + component scores + action list)
```

### report
```powershell
node C:\AICOE\eva-foundry\48-eva-veritas\src\cli.js report --repo C:\AICOE\eva-foundry\37-data-model
# Output: console report (trust score + gap summary + next actions)
```

### audit (all-in-one)
```powershell
node C:\AICOE\eva-foundry\48-eva-veritas\src\cli.js audit --repo C:\AICOE\eva-foundry\37-data-model --warn-only
# Runs discover -> reconcile -> compute-trust -> report in sequence
# --warn-only: prints gaps but exits 0 (for CI tolerance of non-blocking gaps)
```

---

## READING TRUST.JSON

**Location**: `.eva/trust.json`

**Structure**:
```json
{
  "mti": 95.2,
  "components": {
    "coverage": 0.95,
    "evidenceCompleteness": 0.92,
    "consistency": 0.98
  },
  "total_stories": 52,
  "implemented_stories": 48,
  "with_evidence": 46,
  "with_artifacts": 100,
  "actions": [
    "Add evidence for F37-FK-001",
    "Tag source file for F37-FK-002"
  ],
  "computed_at": "2026-03-08T15:42:00.000Z"
}
```

**Interpretation**:
- **MTI >= 95**: PASS (37-data-model gate)
- **MTI < 95**: FAIL -- fix gaps before sprint advance
- **actions array**: Top priority fixes (max 5 shown)

---

## SPRINT GATE INTEGRATION

### Phase 1.2 -- Veritas Audit

```powershell
$repo = "C:\AICOE\eva-foundry\37-data-model"
node C:\AICOE\eva-foundry\48-eva-veritas\src\cli.js audit --repo $repo --warn-only 2>&1 |
    Tee-Object "$repo\veritas-audit-out.txt" | Select-Object -Last 30
```

**Read the output**:
- `missing_implementation` gaps on DONE stories = BLOCKER
- `missing_evidence` gaps on DONE stories = BLOCKER
- `orphan_story_tag` = WARNING (fix before next sprint)

### Phase 1.3 -- MTI Gate Check

```powershell
$t = Get-Content "$repo\.eva\trust.json" | ConvertFrom-Json
Write-Host "MTI: $($t.mti)   Gate: 95   Status: $(if($t.mti -ge 95){'PASS'}else{'FAIL'})"
if ($t.mti -lt 95) {
    Write-Host "Actions:"
    $t.actions | ForEach-Object { Write-Host "  - $_" }
}
```

**If FAIL**: Do NOT proceed to Phase 2. Fix gaps, rerun audit, verify MTI >= 95.

---

## GAP REMEDIATION WORKFLOW

### Step 1 -- Read the gap list

```powershell
$r = Get-Content .eva\reconciliation.json | ConvertFrom-Json
$gaps = $r.gaps | Where-Object { $_.story_status -eq "DONE" }
Write-Host "Gaps on DONE stories: $($gaps.Count)"
foreach ($g in $gaps | Select-Object -First 10) {
    Write-Host "  $($g.gap_type): $($g.story_id) -- $($g.story_title)"
}
```

### Step 2 -- Fix each gap by type

| Gap Type | Action | Command |
|---|---|---|
| `missing_implementation` | Add source tag | Edit file, add `# EVA-STORY: F37-NN-NNN` on functional line |
| `missing_evidence` | Add test tag | Create/edit `tests/test_F37-NN-NNN_<name>.py` with tag |
| `orphan_story_tag` | Remove or fix ID | Edit source file, correct or remove tag |

### Step 3 -- Rerun audit

```powershell
node C:\AICOE\eva-foundry\48-eva-veritas\src\cli.js audit --repo $repo --warn-only
$t = Get-Content .eva\trust.json | ConvertFrom-Json
Write-Host "MTI after fix: $($t.mti)"
```

### Step 4 -- Confirm MTI >= gate

```powershell
if ($t.mti -ge 95) {
    Write-Host "[PASS] MTI gate cleared"
    # Proceed to Phase 2
} else {
    Write-Host "[FAIL] MTI still below gate -- fix remaining gaps"
    $t.actions | ForEach-Object { Write-Host "  - $_" }
}
```

---

## 37-DATA-MODEL SPECIFIC NOTES

### Why MTI gate = 95 (not 30)?

**Reason**: 37-data-model is the single source of truth for the entire EVA ecosystem.
A lower gate would permit gaps in foundational entities (endpoints, containers, screens).
Every story tagged here impacts 5+ consuming projects (31-eva-faces, 33-eva-brain-v2, 44-eva-jp-spark, etc.).

**Consequence**: Stricter tagging discipline required. Every completed FK Enhancement story must have:
1. Source tag in `api/`, `schema/`, or `scripts/` (Source A)
2. Test file with passing test in `tests/` (Source B)
3. Validation passing: `POST /model/admin/validate` returns count=0
4. Cosmos export: `POST /model/admin/commit` returns violation_count=0

### FK Enhancement Context

**52 stories**: F37-FK-001 through F37-FK-1106
**27 edge types**: screens->endpoints, endpoints->containers, etc.
**Target MTI**: 99+ by end of Sprint 11 (February 2027)

**Tagging strategy**:
- Phase 0 (validation): Tag validator functions + integration routers
- Phase 1A-1F (store): Tag AbstractStore methods + adapter implementations
- Phase 2-6 (features): Tag routers, schema files, seed scripts, migration scripts

---

## QUICK COMMAND REFERENCE

```powershell
# Full audit (all phases)
node C:\AICOE\eva-foundry\48-eva-veritas\src\cli.js audit --repo C:\AICOE\eva-foundry\37-data-model --warn-only

# Check MTI only
$t = Get-Content C:\AICOE\eva-foundry\37-data-model\.eva\trust.json | ConvertFrom-Json
Write-Host "MTI: $($t.mti)  Gate: 95"

# List gaps on DONE stories
$r = Get-Content C:\AICOE\eva-foundry\37-data-model\.eva\reconciliation.json | ConvertFrom-Json
$r.gaps | Where-Object { $_.story_status -eq "DONE" } | Select-Object gap_type, story_id, story_title

# Count artifacts by type
$a = Get-Content C:\AICOE\eva-foundry\37-data-model\.eva\artifacts.json | ConvertFrom-Json
Write-Host "Source tags: $(($a | Where-Object { $_.type -eq 'source' }).Count)"
Write-Host "Test tags: $(($a | Where-Object { $_.type -eq 'test' }).Count)"
Write-Host "Evidence receipts: $(($a | Where-Object { $_.type -eq 'receipt' }).Count)"

# Check if story has evidence
$story_id = "F37-FK-001"
$a | Where-Object { $_.story_ids -contains $story_id } | Select-Object type, file_path, line_number
```

---

## COMMON PITFALLS

| Pitfall | Symptom | Fix |
|---|---|---|
| Tag in blank comment block | Coverage stays 0% after tag | Move tag to functional line (class, function, route) |
| Test file but no tag | evidenceCompleteness stays low | Add `# EVA-STORY: F37-NN-NNN` to test file |
| Tag format typo | Orphan artifact gap | Use EXACT format: `# EVA-STORY: F37-NN-NNN` |
| Tag before PLAN.md update | Orphan artifact gap | Update PLAN.md first, then reseed, then tag |
| STATUS.md counts stale | Consistency drops | Update STATUS.md after every sprint |
