# Skill: progress-report
# EVA-STORY: F37-DPDCA-004

**Version**: 1.0.0
**Project**: 37-data-model
**Triggers**: progress report, project status, where are we, epic status, test count, recent commits, fk enhancement progress

---

## PURPOSE

Generate comprehensive project status report by querying:
1. Data model (WBS layer)
2. Veritas audit (MTI, test count)
3. Git log (recent commits with story IDs)

The report answers: "Where are we with FK Enhancement (and all other 37-data-model work)?"

---

## CAPABILITIES

### 1. Epic Completion Percentages
Calculate done stories / total stories per epic (F37-01 Foundation, F37-02 Data/API, F37-FK FK Enhancement).
Display completion bar chart.

### 2. Phase Readiness Score
Check if all stories with milestone="Phase0"|"Phase1A" are status="done".
Report: READY / BLOCKED / percentage complete.

### 3. Recent Commits with Story IDs
Parse last 10 commits, extract F37-NN-NNN story IDs from commit messages.
Link commits to WBS records (show story label + epic).

### 4. Test Count Trend
Extract test count from veritas trust.json (with_evidence count).
Show last 5 values from git history (if tracked).

### 5. Open Blockers Table
All stories with non-empty `blockers` field, grouped by epic.

### 6. Next 5 Recommended Stories
Undone stories with:
- No blocking dependencies (blockers = [])
- Sized (story_points > 0)
- Follow FK Enhancement phase sequence (Phase0 -> Phase1A -> Phase1B -> ...)

---

## DATA SOURCES

| Source | Location | Query |
|---|---|---|
| WBS records | `/model/wbs/` | Filter by project_id="37-data-model" |
| MTI score | `.eva/trust.json` | Parse JSON, read mti field |
| Test count | `.eva/trust.json` | Parse JSON, read implemented_stories + with_evidence |
| Git commits | `git log` | Last 10 commits, grep for F37-NN-NNN |

---

## EXECUTION WORKFLOW

### Step 1: Query all WBS records for 37-data-model

```powershell
$base = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io"
$wbs = Invoke-RestMethod "$base/model/wbs/" |
    Where-Object { $_.project_id -eq "37-data-model" }

$epics = $wbs | Where-Object { $_.level -eq "epic" }
$features = $wbs | Where-Object { $_.level -eq "feature" }
$stories = $wbs | Where-Object { $_.level -eq "story" }

Write-Host "Total WBS objects: $($wbs.Count)"
Write-Host "  Epics: $($epics.Count)"
Write-Host "  Features: $($features.Count)"
Write-Host "  Stories: $($stories.Count)"
```

### Step 2: Calculate epic completion percentages

```powershell
$epic_progress = @()
foreach ($epic in $epics) {
    $epic_stories = $stories | Where-Object { $_.parent_wbs_id -match "^$($epic.id)" }
    $done_count = ($epic_stories | Where-Object { $_.status -eq "done" }).Count
    $total_count = $epic_stories.Count
    $pct = if ($total_count -gt 0) { [math]::Round($done_count / $total_count * 100, 1) } else { 0 }
    
    $epic_progress += [PSCustomObject]@{
        Epic = $epic.label
        Done = $done_count
        Total = $total_count
        Percent = $pct
    }
}

Write-Host "`nEpic Progress:"
$epic_progress | Format-Table -AutoSize
```

### Step 3: Check Phase 0 + Phase 1A readiness

```powershell
$phase0_stories = $stories | Where-Object { $_.milestone -eq "Phase0" }
$phase0_done = ($phase0_stories | Where-Object { $_.status -eq "done" }).Count
$phase0_total = $phase0_stories.Count
$phase0_pct = if ($phase0_total -gt 0) { [math]::Round($phase0_done / $phase0_total * 100, 1) } else { 0 }

$phase1a_stories = $stories | Where-Object { $_.milestone -eq "Phase1A" }
$phase1a_done = ($phase1a_stories | Where-Object { $_.status -eq "done" }).Count
$phase1a_total = $phase1a_stories.Count
$phase1a_pct = if ($phase1a_total -gt 0) { [math]::Round($phase1a_done / $phase1a_total * 100, 1) } else { 0 }

Write-Host "`nPhase Readiness:"
if ($phase0_pct -eq 100) {
    Write-Host "  [PASS] Phase 0 READY -- all stories done" -ForegroundColor Green
} else {
    Write-Host "  [WARN] Phase 0 NOT READY -- $phase0_pct% complete ($phase0_done/$phase0_total)" -ForegroundColor Yellow
}

if ($phase1a_pct -eq 100) {
    Write-Host "  [PASS] Phase 1A READY -- all stories done" -ForegroundColor Green
} else {
    Write-Host "  [WARN] Phase 1A NOT READY -- $phase1a_pct% complete ($phase1a_done/$phase1a_total)" -ForegroundColor Yellow
}
```

### Step 4: Parse recent commits for story IDs

```powershell
$repo = "C:\eva-foundry\37-data-model"
$recent_commits = git -C $repo log --oneline -10 2>&1

$story_commits = @()
$recent_commits | ForEach-Object {
    if ($_ -match '(F37-\d{2}-\d{3})') {
        $story_id = $matches[1]
        $story = $stories | Where-Object { $_.id -eq $story_id }
        $story_commits += [PSCustomObject]@{
            Commit = $_.Substring(0, 8)
            StoryID = $story_id
            Label = if ($story) { $story.label } else { "(not in WBS)" }
            Epic = if ($story) { $story.parent_wbs_id.Substring(0, 9) } else { "N/A" }
        }
    }
}

Write-Host "`nRecent commits with story IDs:"
if ($story_commits) {
    $story_commits | Format-Table -AutoSize
} else {
    Write-Host "  (no story IDs in last 10 commits)"
}
```

### Step 5: Get test count and MTI from veritas

```powershell
if (Test-Path "$repo\.eva\trust.json") {
    $trust = Get-Content "$repo\.eva\trust.json" | ConvertFrom-Json
    $test_count = $trust.with_evidence
    $mti = $trust.mti
    
    Write-Host "`nCurrent metrics:"
    Write-Host "  Test count: $test_count"
    Write-Host "  MTI score: $mti  (Gate: 95)"
    Write-Host "  Status: $(if ($mti -ge 95) { '[PASS]' } else { '[FAIL] below gate' })"
} else {
    Write-Host "`n[WARN] No trust.json found -- run veritas audit first"
    $test_count = "N/A"
    $mti = "N/A"
}
```

### Step 6: List open blockers

```powershell
$blocked_stories = $stories | Where-Object { $_.blockers.Count -gt 0 }

if ($blocked_stories) {
    Write-Host "`nOpen blockers: $($blocked_stories.Count)"
    $blocked_stories | ForEach-Object {
        Write-Host "  $($_.id) -- $($_.label)"
        Write-Host "    Blocked by: $($_.blockers -join ', ')"
    }
} else {
    Write-Host "`n[PASS] No stories blocked"
}
```

### Step 7: Recommend next 5 stories (FK Enhancement phase-aware)

```powershell
# Prioritize by FK Enhancement phase sequence: Phase0 -> Phase1A -> Phase1B -> Phase2 -> ...
$phase_order = @("Phase0", "Phase1A", "Phase1B", "Phase1C", "Phase1D", "Phase1E", "Phase1F", "Phase2", "Phase3", "Phase4", "Phase5", "Phase6")

$recommended = @()
foreach ($phase in $phase_order) {
    $undone_in_phase = $stories |
        Where-Object { $_.milestone -eq $phase -and $_.status -ne "done" -and $_.blockers.Count -eq 0 -and $_.story_points -gt 0 } |
        Sort-Object { $_.id }
    
    $recommended += $undone_in_phase
    
    if ($recommended.Count -ge 5) { break }
}

$recommended = $recommended | Select-Object -First 5

Write-Host "`nNext 5 recommended stories:"
if ($recommended) {
    $recommended | ForEach-Object {
        Write-Host "  $($_.id) -- $($_.label) (FP=$($_.story_points), milestone=$($_.milestone))"
    }
} else {
    Write-Host "  (no eligible stories -- all undone stories are blocked or unsized)"
}
```

### Step 8: Generate progress report

```powershell
$report = @"
# Progress Report: 37-data-model

**Generated**: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss UTC')
**Test Count**: $test_count
**MTI Score**: $mti (Gate: 95)
**MTI Status**: $(if ($mti -ge 95 -or $mti -eq "N/A") { "PASS" } else { "FAIL (below gate)" })

## Epic Completion

| Epic | Done | Total | Percent |
|------|------|-------|---------|
$(($epic_progress | ForEach-Object { "| $($_.Epic) | $($_.Done) | $($_.Total) | $($_.Percent)% |" }) -join "`n")

## FK Enhancement Phase Readiness

- **Phase 0** (Server-Side Validation): $phase0_pct% complete ($phase0_done/$phase0_total stories)
  - Status: $(if ($phase0_pct -eq 100) { "READY" } else { "NOT READY" })
  
- **Phase 1A** (Store Interface + Schema): $phase1a_pct% complete ($phase1a_done/$phase1a_total stories)
  - Status: $(if ($phase1a_pct -eq 100) { "READY" } else { "NOT READY" })

## Recent Commits (Last 10)

$(if ($story_commits) {
    "| Commit | Story ID | Label | Epic |`n" +
    "|--------|----------|-------|------|`n" +
    (($story_commits | ForEach-Object { "| $($_.Commit) | $($_.StoryID) | $($_.Label) | $($_.Epic) |" }) -join "`n")
} else {
    "*No story IDs found in last 10 commits*"
})

## Open Blockers

$(if ($blocked_stories) {
    (($blocked_stories | ForEach-Object { "- **$($_.id)**: $($_.label)`n  Blocked by: $($_.blockers -join ', ')" }) -join "`n`n")
} else {
    "No stories blocked"
})

## Next 5 Recommended Stories

$(if ($recommended) {
    (($recommended | ForEach-Object { "1. **$($_.id)** -- $($_.label) (FP=$($_.story_points), milestone=$($_.milestone))" }) -join "`n")
} else {
    "*No eligible stories (all undone stories are blocked or unsized)*"
})

---
*Progress report updated. Use this instead of STATUS.md for current snapshot.*
"@

$report_path = "$repo\docs\progress-report.md"
$report | Set-Content $report_path -Encoding UTF8
Write-Host "`n[PASS] Progress report written to: $report_path"
```

---

## OUTPUT FORMATS

### 1. Markdown Report (human-readable)
- Saved to: `docs/progress-report.md`
- Contains: Epic completion table, phase readiness, recent commits, blockers, next stories

### 2. JSON Artifact (machine-readable)
```json
{
  "generated": "2026-03-01T18:45:00Z",
  "test_count": 48,
  "mti": 95.2,
  "mti_gate": 95,
  "epic_progress": [
    {"epic": "F37-FK", "done": 12, "total": 52, "percent": 23.1}
  ],
  "phase0_readiness": {
    "status": "READY",
    "done": 3,
    "total": 3,
    "percent": 100.0
  },
  "phase1a_readiness": {
    "status": "NOT_READY",
    "done": 5,
    "total": 8,
    "percent": 62.5
  },
  "blockers": [
    {"story_id": "F37-FK-103", "blocked_by": ["F37-FK-101"]}
  ],
  "recommended": [
    {"story_id": "F37-FK-101", "fp": 5, "milestone": "Phase1A"}
  ]
}
```

---

## 37-DATA-MODEL SPECIFIC NOTES

### Why MTI gate = 95?

37-data-model is the single source of truth for the entire EVA ecosystem.
A lower gate would permit gaps in foundational entities (endpoints, containers, screens).
Every story tagged here impacts 5+ consuming projects.

### FK Enhancement phase tracking

The FK Enhancement spans 12 sprints across 7 phases:
- **Phase 0** (Sprint 0, 48h, 3 stories, 5 FP): Server-side validation
- **Phase 1A** (Sprint 1, 80h, 8 stories, 13 FP): Store interface + schema
- **Phase 1B-1F** (Sprints 2-6, variable, 16 stories, 26 FP): Store adapters, routers, seeding
- **Phase 2-6** (Sprints 7-11, variable, 25 stories, 39 FP): Saga merge, cycle detection, cascade, advanced features

The "Next 5 Recommended Stories" respects this phase sequence: never recommend Phase1B stories until Phase1A is 100% done.

### Relationship with STATUS.md

This skill **replaces** manual STATUS.md updates. Workflow:

1. Developer makes change (implements FK Enhancement story)
2. Developer commits with story ID in message
3. Developer posts "progress report" to Copilot
4. This skill runs, generates `docs/progress-report.md`
5. Optional: Copy progress-report.md content to STATUS.md for legacy compatibility

---

## EXAMPLE USAGE

**Copilot prompt:**
```
progress report
```

**Expected output:**
1. Query WBS for ~60 objects (3 epics: F37-01, F37-02, F37-FK; 10 features; 52+ stories)
2. Calculate epic completion (F37-FK: 23%, F37-01: 100%, F37-02: 80%)
3. Check Phase0 + Phase1A readiness (Phase0: 100%, Phase1A: 62.5%)
4. Parse last 10 commits (find story IDs like F37-FK-001, F37-FK-002)
5. Get test count from veritas (48 tests, MTI=95.2)
6. List open blockers (2 stories blocked)
7. Recommend next 5 stories (prioritize Phase1A unblocked stories)
8. Generate markdown report at `docs/progress-report.md`
9. Display summary in chat

---

## ERROR HANDLING

| Error | Cause | Recovery |
|---|---|---|
| No WBS records | Data model not seeded | Run seed-from-plan.py first |
| No trust.json | Never ran veritas audit | Show "N/A" for MTI/test count |
| Git log fails | Not in git repo | Skip recent commits section |
| Percentage overflow | Division by zero (epic with 0 stories) | Guard with `if ($total -gt 0)` |
| No recommended stories | All undone stories blocked | Show message "(all stories blocked)" |

---

## QUICK COMMAND REFERENCE

```powershell
# Full progress report
# (Just paste Step 1 through Step 8 above into PowerShell)

# Quick epic status
$base = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io"
$wbs = Invoke-RestMethod "$base/model/wbs/" | Where-Object { $_.project_id -eq "37-data-model" }
$epics = $wbs | Where-Object { $_.level -eq "epic" }
$stories = $wbs | Where-Object { $_.level -eq "story" }
foreach ($epic in $epics) {
    $epic_stories = $stories | Where-Object { $_.parent_wbs_id -match "^$($epic.id)" }
    $done = ($epic_stories | Where-Object { $_.status -eq "done" }).Count
    Write-Host "$($epic.label): $done / $($epic_stories.Count) done"
}

# Quick MTI check
$t = Get-Content C:\eva-foundry\37-data-model\.eva\trust.json | ConvertFrom-Json
Write-Host "MTI: $($t.mti)  Gate: 95  Status: $(if ($t.mti -ge 95) { 'PASS' } else { 'FAIL' })"
```
