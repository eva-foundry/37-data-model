# Skill: sprint-report
# EVA-STORY: F37-DPDCA-005

**Version**: 1.0.0
**Project**: 37-data-model
**Triggers**: sprint report, sprint summary, velocity, sprint metrics, sprint dashboard, show sprint, fk enhancement sprint summary

---

## PURPOSE

Generate comprehensive sprint summary reports from data model queries. This skill replaces
manual STATUS.md updates with queryable metrics from sprints layer + WBS layer + veritas audit.

For FK Enhancement (12 sprints), this provides velocity tracking and phase completion progress.

---

## CAPABILITIES

1. **Sprint velocity chart** - Planned vs actual FP delivered
2. **Story completion table** - Done/in-progress/blocked breakdown
3. **MTI trend** - Current sprint vs prior 3 sprints (target: MTI >= 95)
4. **Blocker list** - All stories with non-empty blockers field
5. **Test coverage delta** - Test count at sprint start vs close

---

## DATA SOURCES

| Source | Layer | Query |
|---|---|---|
| Sprint records | `/model/sprints/` | Filter by project_id="37-data-model" |
| Story status | `/model/wbs/` | Filter by sprint_id + level="story" |
| MTI scores | veritas audit output | `.eva/trust.json` per sprint |
| Test counts | veritas audit | Parse from trust.json (with_evidence count) |

---

## EXECUTION WORKFLOW

### Step 1: Query sprint record

```powershell
$base = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io"
$sprint_id = "37-data-model-sprint-00"  # Replace with actual sprint ID
$sprint = Invoke-RestMethod "$base/model/sprints/$sprint_id"

Write-Host "Sprint: $($sprint.label)"
Write-Host "Status: $($sprint.status)"
Write-Host "Started: $($sprint.started_at)"
Write-Host "Completed: $($sprint.completed_at)"
```

### Step 2: Query all stories for this sprint

```powershell
$stories = Invoke-RestMethod "$base/model/wbs/" |
    Where-Object { $_.sprint_id -eq $sprint_id -and $_.level -eq "story" }

$total = $stories.Count
$done = ($stories | Where-Object { $_.status -eq "done" }).Count
$in_progress = ($stories | Where-Object { $_.status -eq "in_progress" }).Count
$blocked = ($stories | Where-Object { $_.blockers.Count -gt 0 }).Count

Write-Host "Stories: $done done / $total total ($([math]::Round($done/$total*100))%)"
Write-Host "In Progress: $in_progress"
Write-Host "Blocked: $blocked"
```

### Step 3: Calculate velocity

```powershell
$planned_fp = ($stories | Measure-Object -Property story_points -Sum).Sum
$delivered_fp = ($stories | Where-Object { $_.status -eq "done" } |
    Measure-Object -Property story_points -Sum).Sum

$velocity = if ($sprint.completed_at -and $sprint.started_at) {
    $start = [datetime]::Parse($sprint.started_at)
    $end = [datetime]::Parse($sprint.completed_at)
    $days = ($end - $start).TotalDays
    if ($days -gt 0) { $delivered_fp / $days } else { 0 }
} else { 0 }

Write-Host "Planned FP: $planned_fp"
Write-Host "Delivered FP: $delivered_fp"
Write-Host "Velocity: $([math]::Round($velocity, 2)) FP/day"
```

### Step 4: Get MTI trend (last 4 sprints)

```powershell
$all_sprints = Invoke-RestMethod "$base/model/sprints/" |
    Where-Object { $_.project_id -eq "37-data-model" -and $_.id -ne "37-data-model-sprint-backlog" } |
    Sort-Object id -Descending | Select-Object -First 4

$mti_trend = @()
foreach ($s in $all_sprints) {
    $mti = if ($s.mti_at_close) { $s.mti_at_close } else { "N/A" }
    $gate_status = if ($mti -eq "N/A") { "" } elseif ($mti -ge 95) { "(PASS)" } else { "(FAIL - below gate)" }
    $mti_trend += "$($s.label): MTI=$mti $gate_status"
}

Write-Host "`nMTI Trend (last 4 sprints, gate=95):"
$mti_trend | ForEach-Object { Write-Host "  $_" }
```

### Step 5: List blockers

```powershell
$blocked_stories = $stories | Where-Object { $_.blockers.Count -gt 0 }

if ($blocked_stories) {
    Write-Host "`nBlocked Stories:"
    $blocked_stories | ForEach-Object {
        Write-Host "  $($_.id) -- $($_.label)"
        Write-Host "    Blockers: $($_.blockers -join ', ')"
    }
} else {
    Write-Host "`nNo blocked stories"
}
```

### Step 6: Get test count delta

```powershell
$repo = "C:\AICOE\eva-foundry\37-data-model"
if (Test-Path "$repo\.eva\trust.json") {
    $trust = Get-Content "$repo\.eva\trust.json" | ConvertFrom-Json
    $test_count_current = $trust.with_evidence
    
    # Try to get prior sprint test count (from sprint record or git history)
    $test_count_start = if ($sprint.test_count_at_start) { $sprint.test_count_at_start } else { "N/A" }
    
    Write-Host "`nTest Count:"
    Write-Host "  Start of sprint: $test_count_start"
    Write-Host "  End of sprint: $test_count_current"
    if ($test_count_start -ne "N/A") {
        $delta = $test_count_current - $test_count_start
        Write-Host "  Delta: +$delta tests"
    }
} else {
    Write-Host "`n[WARN] No trust.json found -- run veritas audit first"
    $test_count_current = "N/A"
}
```

### Step 7: Generate markdown report

```powershell
$report = @"
# Sprint Report: $($sprint.label)

**Status**: $($sprint.status)
**Duration**: $(if ($sprint.started_at) { $sprint.started_at }) to $(if ($sprint.completed_at) { $sprint.completed_at } else { 'In Progress' })
**Phase**: $($sprint.phase)  (FK Enhancement phase)

## Metrics

| Metric | Value |
|--------|-------|
| Total Stories | $total |
| Done | $done ($([math]::Round($done/$total*100))%) |
| In Progress | $in_progress |
| Blocked | $blocked |
| Planned FP | $planned_fp |
| Delivered FP | $delivered_fp |
| Velocity | $([math]::Round($velocity, 2)) FP/day |
| Test Count | $test_count_current $(if ($test_count_start -ne "N/A") { "(+$($test_count_current - $test_count_start))" } else { "" }) |

## MTI Trend (Gate: 95)

$($mti_trend -join "`n")

## Story Breakdown

| Story ID | Status | FP | Milestone | Blockers |
|----------|--------|----|-----------|----|
$(($stories | ForEach-Object { "| $($_.id) | $($_.status) | $($_.story_points) | $($_.milestone) | $($_.blockers -join ', ') |" }) -join "`n")

## Blockers

$(if ($blocked_stories) {
    ($blocked_stories | ForEach-Object { "- **$($_.id)**: $($_.label)`n  Blocked by: $($_.blockers -join ', ')" }) -join "`n`n"
} else {
    "No blockers"
})

---
*Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss UTC')*
"@

$report_path = "$repo\docs\sprint-report-$sprint_id.md"
$report | Set-Content $report_path -Encoding UTF8
Write-Host "`n[PASS] Sprint report written to: $report_path"
```

---

## OUTPUT FORMATS

### 1. Markdown Report (human-readable)
- Saved to: `docs/sprint-report-{sprint-id}.md`
- Contains: Metrics table, MTI trend, story breakdown, blockers

### 2. JSON Artifact (machine-readable)
```json
{
  "sprint_id": "37-data-model-sprint-00",
  "phase": "Phase0",
  "status": "completed",
  "metrics": {
    "total_stories": 3,
    "done": 3,
    "in_progress": 0,
    "blocked": 0,
    "planned_fp": 5,
    "delivered_fp": 5,
    "velocity": 0.10,
    "test_count": 48,
    "test_count_delta": 12
  },
  "mti_trend": [
    {"sprint": "Sprint 0", "mti": 95.2, "gate_status": "PASS"}
  ],
  "blockers": []
}
```

---

## INTEGRATION WITH SPRINT-ADVANCE

This skill is invoked automatically in sprint-advance.skill.md Phase 5:

```powershell
# After sprint manifest is created, generate report
node C:\AICOE\eva-foundry\48-eva-veritas\src\cli.js audit --repo . --warn-only

# Trigger: "sprint report" or "generate sprint summary"
# This skill runs and produces:
#   1. docs/sprint-report-37-data-model-sprint-NN.md
#   2. .eva/sprint-NN-summary.json (optional, for dashboards)
```

---

## FK ENHANCEMENT CONTEXT

### Sprint-to-Phase Mapping

| Sprint | Phase | Stories | FP | Duration |
|--------|-------|---------|----|----|
| Sprint 0 | Phase0 | 3 | 5 | 48h |
| Sprint 1 | Phase1A | 8 | 13 | 80h |
| Sprint 2 | Phase1B | 4 | 6 | 48h |
| Sprint 3 | Phase1C | 3 | 5 | 40h |
| Sprint 4 | Phase1D | 3 | 5 | 40h |
| Sprint 5 | Phase1E | 3 | 5 | 40h |
| Sprint 6 | Phase1F | 3 | 5 | 40h |
| Sprint 7 | Phase2 | 5 | 8 | 64h |
| Sprint 8 | Phase3 | 6 | 10 | 80h |
| Sprint 9 | Phase4 | 5 | 8 | 64h |
| Sprint 10 | Phase5 | 5 | 8 | 64h |
| Sprint 11 | Phase6 | 4 | 5 | 40h |

**Total**: 12 sprints, 52 stories, 83 FP, 653 hours (March 2026 → February 2027)

### MTI Gate = 95

37-data-model requires MTI >= 95 (not 30 like app projects).
Every sprint report shows MTI gate status: PASS or FAIL.

### Velocity Baseline

FK Enhancement baseline: 1 FP = 1 hour (for gpt-4o).
Sprint 0 target: 5 FP in 48h (velocity = 0.10 FP/day).
Adjust in subsequent sprints based on actual velocity from prior sprints.

---

## EXAMPLE USAGE

**Copilot prompt:**
```
sprint report for sprint 0
```

**Expected output:**
1. Query data model for sprint-00 record
2. Query all stories with sprint_id="37-data-model-sprint-00"
3. Calculate metrics (velocity, completion %, blockers)
4. Query MTI from veritas audit (check gate: >= 95)
5. Get test count delta (start: 36, end: 48, delta: +12)
6. Generate markdown report at `docs/sprint-report-37-data-model-sprint-00.md`
7. Display summary in chat

---

## ERROR HANDLING

| Error | Cause | Recovery |
|---|---|---|
| 404 on sprint record | Sprint ID not in data model | List available sprints, prompt for correct ID |
| 0 stories returned | Wrong sprint_id filter | Check sprint_id format (must match "37-data-model-sprint-NN") |
| MTI unavailable | No .eva/trust.json | Show "N/A" in report, recommend running veritas audit |
| Velocity = 0 | Sprint not completed | Show planned metrics only, mark report as "in-progress" |
| Test count delta N/A | No test_count_at_start in sprint record | Show current test count only |

---

## QUICK COMMAND REFERENCE

```powershell
# Full sprint report for Sprint 0
$base = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io"
$sprint_id = "37-data-model-sprint-00"
# [Use Steps 1-7 above]

# Quick sprint status
$sprint = Invoke-RestMethod "$base/model/sprints/$sprint_id"
$stories = Invoke-RestMethod "$base/model/wbs/" | Where-Object { $_.sprint_id -eq $sprint_id }
$done = ($stories | Where-Object { $_.status -eq "done" }).Count
Write-Host "$($sprint.label): $done / $($stories.Count) done"

# MTI gate check
$t = Get-Content C:\AICOE\eva-foundry\37-data-model\.eva\trust.json | ConvertFrom-Json
Write-Host "MTI: $($t.mti)  Gate: 95  Status: $(if ($t.mti -ge 95) { 'PASS' } else { 'FAIL' })"
```

---

## DEPENDENCIES

- Data model API: `https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io`
- Veritas CLI: `C:\AICOE\eva-foundry\48-eva-veritas\src\cli.js`
- PowerShell 7+

---

## MAINTENANCE

Update this skill when:
- Sprint schema changes (new fields added to sprints layer)
- WBS schema changes (new status values, blockers format)
- Report format requirements change (new metrics, different layout)
- FK Enhancement completes (12 sprints) and new initiatives start
