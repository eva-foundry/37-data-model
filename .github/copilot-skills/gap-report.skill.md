# Skill: gap-report
# EVA-STORY: F37-DPDCA-003

**Version**: 1.0.0
**Project**: 37-data-model
**Triggers**: gap report, blocker analysis, critical blockers, missing evidence report,
  orphan tags, dependency chain, estimate to milestone, gap remediation

---

## PURPOSE

This skill generates comprehensive gap analysis reports for 37-data-model. It identifies:
1. **Critical blockers**: Stories blocking other work with status != done
2. **Missing evidence**: DONE stories without test files or receipts
3. **Orphan tags**: EVA-STORY tags not matching any plan story
4. **Dependency chains**: Transitive closure via `blockers` field with FP estimates
5. **Milestone estimates**: FP sum of undone stories for given milestone

**Output**: Markdown report at `docs/gap-report.md`

---

## DATA SOURCES

### 1. WBS Layer (via data model API)

```powershell
$base = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io"
$wbs = Invoke-RestMethod "$base/model/wbs/"
# Fields: id, title, status, blockers (array), milestone, story_points (FP), epic
```

**Key fields**:
- `id`: Story ID (e.g. F37-FK-001)
- `status`: "planned" | "active" | "done"
- `blockers`: Array of story IDs this story blocks (forward dependency)
- `milestone`: "Phase0" | "Phase1A" | "Sprint-01" | etc.
- `story_points`: Function points (0.5-5.0)

### 2. Veritas Reconciliation (`.eva/reconciliation.json`)

```powershell
$r = Get-Content C:\AICOE\eva-foundry\37-data-model\.eva\reconciliation.json | ConvertFrom-Json
# Fields: gaps (array), gap_type, story_id, story_status, story_title, remediation
```

**Gap types**:
- `missing_implementation`: No source tag
- `missing_evidence`: No test file or receipt
- `orphan_story_tag`: Tag ID not in plan

### 3. Veritas Artifacts (`.eva/artifacts.json`)

```powershell
$a = Get-Content C:\AICOE\eva-foundry\37-data-model\.eva\artifacts.json | ConvertFrom-Json
# Fields: file_path, line_number, story_ids (array), type (source|test|receipt)
```

### 4. Veritas Plan (`.eva/veritas-plan.json`)

```powershell
$vp = Get-Content C:\AICOE\eva-foundry\37-data-model\.eva\veritas-plan.json | ConvertFrom-Json
# Fields: features (array), stories (array per feature), id, title, done (bool)
```

---

## CAPABILITY 1 -- CRITICAL BLOCKERS

### Definition

A story is a **critical blocker** if:
1. Another story's `blockers` field contains its ID
2. Its `status` is NOT "done"

### Query

```powershell
$base = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io"
$wbs = Invoke-RestMethod "$base/model/wbs/"

# Find all stories that are blocked
$blocked_map = @{}
foreach ($s in $wbs) {
    if ($s.blockers -and $s.blockers.Count -gt 0) {
        foreach ($b in $s.blockers) {
            if (-not $blocked_map.ContainsKey($b)) { $blocked_map[$b] = @() }
            $blocked_map[$b] += $s.id
        }
    }
}

# Check which blockers are not done
foreach ($blocker_id in $blocked_map.Keys) {
    $blocker = $wbs | Where-Object { $_.id -eq $blocker_id }
    if ($blocker.status -ne "done") {
        $blocked_stories = $blocked_map[$blocker_id]
        Write-Host "[CRITICAL BLOCKER] $blocker_id ($($blocker.status)) blocks: $($blocked_stories -join ', ')"
        Write-Host "  Title: $($blocker.title)"
        Write-Host "  FP: $($blocker.story_points)  Epic: $($blocker.epic)"
    }
}
```

### Report Format

```markdown
## Critical Blockers

| Blocker ID | Status | FP | Blocks | Milestone |
|---|---|---|---|---|
| F37-FK-101 | active | 5 | F37-FK-103, F37-FK-104, F37-FK-105 | Phase1A |
| F37-FK-102 | planned | 3 | F37-FK-106 | Phase1A |

**Total blocked stories**: 4
**Total blocked FP**: 8
```

---

## CAPABILITY 2 -- MISSING EVIDENCE

### Definition

A story has **missing evidence** if:
1. PLAN.md marks it `Status: DONE`
2. Veritas reconciliation has gap type `missing_evidence`

### Query

```powershell
$r = Get-Content C:\AICOE\eva-foundry\37-data-model\.eva\reconciliation.json | ConvertFrom-Json
$missing_ev = $r.gaps | Where-Object { $_.gap_type -eq "missing_evidence" -and $_.story_status -eq "DONE" }

foreach ($g in $missing_ev) {
    Write-Host "[MISSING EVIDENCE] $($g.story_id) -- $($g.story_title)"
    Write-Host "  Remediation: $($g.remediation)"
}
```

### Report Format

```markdown
## Missing Evidence

**Count**: 2

| Story ID | Title | Remediation |
|---|---|---|
| F37-FK-001 | Implement string-array validator | Create tests/test_F37-FK-001_validation.py with EVA-STORY tag |
| F37-FK-003 | Backfill validation + reporting | Add EVA-STORY tag to existing test file |
```

---

## CAPABILITY 3 -- ORPHAN TAGS

### Definition

An **orphan tag** is an EVA-STORY tag in source code whose ID does NOT exist in `.eva/veritas-plan.json`.

### Query

```powershell
$a = Get-Content C:\AICOE\eva-foundry\37-data-model\.eva\artifacts.json | ConvertFrom-Json
$vp = Get-Content C:\AICOE\eva-foundry\37-data-model\.eva\veritas-plan.json | ConvertFrom-Json
$valid_ids = $vp.features.stories | Select-Object -ExpandProperty id

foreach ($artifact in $a) {
    foreach ($id in $artifact.story_ids) {
        if ($id -notin $valid_ids) {
            Write-Host "[ORPHAN TAG] $id in $($artifact.file_path):$($artifact.line_number)"
        }
    }
}
```

### Report Format

```markdown
## Orphan Tags

**Count**: 3

| Orphan ID | File | Line | Fix |
|---|---|---|---|
| ACA-12-999 | api/validation.py | 42 | Replace with F37-FK-001 or remove |
| F37-99-999 | tests/test_old.py | 10 | Remove (test no longer in plan) |
```

---

## CAPABILITY 4 -- DEPENDENCY CHAINS

### Definition

A **dependency chain** is the transitive closure of the `blockers` field:
- Story A blocks B
- B blocks C
- Chain: A -> B -> C (total FP = FP_A + FP_B + FP_C)

### Algorithm (BFS)

```powershell
function Get-DependencyChain {
    param([string]$StartStoryId, [array]$AllStories)
    
    $visited = @{}
    $queue = @($StartStoryId)
    $chain = @()
    $totalFP = 0
    
    while ($queue.Count -gt 0) {
        $current = $queue[0]
        $queue = $queue[1..$queue.Count]
        
        if ($visited.ContainsKey($current)) { continue }
        $visited[$current] = $true
        
        $story = $AllStories | Where-Object { $_.id -eq $current }
        if (-not $story) { continue }
        
        $chain += $story
        $totalFP += $story.story_points
        
        # Add all stories this one blocks
        if ($story.blockers -and $story.blockers.Count -gt 0) {
            foreach ($b in $story.blockers) {
                if (-not $visited.ContainsKey($b)) {
                    $queue += $b
                }
            }
        }
    }
    
    return @{ chain = $chain; totalFP = $totalFP }
}

# Usage
$base = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io"
$wbs = Invoke-RestMethod "$base/model/wbs/"
$result = Get-DependencyChain -StartStoryId "F37-FK-101" -AllStories $wbs
Write-Host "Chain length: $($result.chain.Count)  Total FP: $($result.totalFP)"
$result.chain | Select-Object id, title, story_points | Format-Table
```

### Report Format

```markdown
## Dependency Chain: F37-FK-101

**Total stories in chain**: 8
**Total FP**: 24
**Completion estimate**: 24 hours (1 FP = 1 hour baseline)

| Story ID | Title | FP | Status |
|---|---|---|---|
| F37-FK-101 | Define RelationshipMeta schema | 5 | active |
| F37-FK-103 | Implement MemoryStore adapter | 2 | planned |
| F37-FK-104 | Create routers for relationships | 3 | planned |
| ... | ... | ... | ... |
```

---

## CAPABILITY 5 -- ESTIMATE TO MILESTONE

### Definition

Sum the FP of all undone stories for a given milestone.

### Query

```powershell
$base = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io"
$wbs = Invoke-RestMethod "$base/model/wbs/"

$milestone = "Phase1A"
$undone = $wbs | Where-Object { $_.milestone -eq $milestone -and $_.status -ne "done" }
$totalFP = ($undone | Measure-Object -Property story_points -Sum).Sum

Write-Host "Milestone: $milestone"
Write-Host "Undone stories: $($undone.Count)"
Write-Host "Total FP: $totalFP"
Write-Host "Estimate: $totalFP hours (baseline 1 FP = 1 hour)"
```

### Report Format

```markdown
## Milestone Estimate: Phase1A

**Undone stories**: 6
**Total FP**: 18
**Estimated hours**: 18 (baseline, adjust for complexity)

**Breakdown by epic**:
- F37-FK (FK Enhancement): 16 FP, 5 stories
- F37-02 (Data/API): 2 FP, 1 story
```

---

## FULL REPORT GENERATION

### Step 1 -- Collect all data

```powershell
$base = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io"
$repo = "C:\AICOE\eva-foundry\37-data-model"

# WBS layer
$wbs = Invoke-RestMethod "$base/model/wbs/"

# Veritas files
$r = Get-Content "$repo\.eva\reconciliation.json" | ConvertFrom-Json
$a = Get-Content "$repo\.eva\artifacts.json" | ConvertFrom-Json
$vp = Get-Content "$repo\.eva\veritas-plan.json" | ConvertFrom-Json
```

### Step 2 -- Generate each section

```powershell
$report = @"
# Gap Analysis Report -- 37-data-model
Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm")

---

## Critical Blockers
[Use Capability 1 query]

---

## Missing Evidence
[Use Capability 2 query]

---

## Orphan Tags
[Use Capability 3 query]

---

## Milestone Progress
[Use Capability 5 query for each milestone: Phase0, Phase1A, Phase1B, ...]

---

## Recommendations

1. **Priority 1 -- Critical blockers**: Complete F37-FK-101, F37-FK-102 to unblock 4 stories.
2. **Priority 2 -- Missing evidence**: Add test files for F37-FK-001, F37-FK-003.
3. **Priority 3 -- Orphan tags**: Fix 3 orphan tags before next sprint.

---
"@

$report | Set-Content "$repo\docs\gap-report.md" -Encoding UTF8
Write-Host "Report written: docs/gap-report.md"
```

---

## SPRINT INTEGRATION

### When to run

- **Phase 2.3** of sprint-advance: After veritas audit, before model update
- **Ad-hoc**: When user asks for blocker analysis

### Usage in sprint-advance

```powershell
# After Phase 2.3 (veritas dump)
# Generate gap report to guide Phase 4 story selection

$repo = "C:\AICOE\eva-foundry\37-data-model"

# Run the full report generation script
pwsh -NoProfile -Command {
    $base = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io"
    $wbs = Invoke-RestMethod "$base/model/wbs/"
    # [Insert full report generation logic from Step 2 above]
    # Output: docs/gap-report.md
}

Write-Host "Gap report generated: docs/gap-report.md"
```

Use the "Critical Blockers" section to prioritize Phase 4 story selection:
- Include all critical blockers in next sprint (if FP budget allows)
- Defer non-blocking stories to later sprints

---

## 37-DATA-MODEL SPECIFIC NOTES

### FK Enhancement blocker scenarios

**Scenario 1**: F37-FK-101 (RelationshipMeta schema) blocks:
- F37-FK-103 (MemoryStore adapter)
- F37-FK-104 (relationship routers)
- F37-FK-105 (CosmosStore adapter)
- F37-FK-106 (seed data)

→ **Action**: F37-FK-101 MUST be in Sprint 1. Without it, 4 stories blocked (12 FP).

**Scenario 2**: F37-FK-201 (saga merge) blocks:
- F37-FK-301 (cycle detection)
- F37-FK-401 (cascade engine)

→ **Action**: Complete F37-FK-201 in Sprint 3 before starting Sprints 5-6 work.

### Milestone alignment

FK Enhancement phases map to milestones:
- **Phase0** = Milestone "Phase0" (3 stories, 5 FP)
- **Phase1A** = Milestone "Phase1A" (8 stories, 13 FP)
- **Phase1B-1F** = Milestones "Phase1B" through "Phase1F" (16 stories, 26 FP)

Use Capability 5 to estimate time-to-milestone completion after each sprint.

---

## QUICK COMMAND REFERENCE

```powershell
# Critical blockers
$base = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io"
$wbs = Invoke-RestMethod "$base/model/wbs/"
$wbs | Where-Object { $_.blockers.Count -gt 0 -and $_.status -ne "done" } | Select-Object id, title, blockers

# Missing evidence count
$r = Get-Content C:\AICOE\eva-foundry\37-data-model\.eva\reconciliation.json | ConvertFrom-Json
($r.gaps | Where-Object { $_.gap_type -eq "missing_evidence" }).Count

# Orphan tags
$a = Get-Content C:\AICOE\eva-foundry\37-data-model\.eva\artifacts.json | ConvertFrom-Json
$vp = Get-Content C:\AICOE\eva-foundry\37-data-model\.eva\veritas-plan.json | ConvertFrom-Json
$valid = $vp.features.stories.id
$a | ForEach-Object { $_.story_ids | Where-Object { $_ -notin $valid } }

# Estimate to milestone
$wbs | Where-Object { $_.milestone -eq "Phase1A" -and $_.status -ne "done" } | Measure-Object -Property story_points -Sum

# Full gap report
# [Use Step 2 script above]
```
