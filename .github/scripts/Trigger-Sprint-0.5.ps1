# ============================================================================
# Trigger Sprint 0.5 -- Bug-Fix Automation Demo
# ============================================================================
# This script creates a GitHub issue with the SPRINT-0.5 manifest embedded,
# which triggers the sprint-agent.yml workflow with bug-fix label.
# The workflow routes to bug_fix_agent.py which executes 3-phase DPDCA
# (Discover RCA → Do Fix → Act Prevent) on 3 real bugs from PR #2.
#
# Expected Result:
# - Sprint 0.5 executes in ~45 minutes
# - 3 bugs analyzed, fixed, and prevented
# - 9 commits + 9 evidence receipts
# - 1 PR ready for review
# ============================================================================

param(
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Stop"

# Read manifest
$manifestPath = "C:\eva-foundry\37-data-model\.github\sprints\SPRINT-0.5-manifest.json"
if (-not (Test-Path $manifestPath)) {
    Write-Error "Manifest not found: $manifestPath"
    exit 1
}

$manifest = Get-Content $manifestPath | ConvertFrom-Json
$manifestJson = $manifest | ConvertTo-Json -Depth 10

# Build issue body with embedded manifest
$issueBody = @"
# Sprint 0.5 -- Bug-Fix Automation Demo

**Status**: Ready for execution  
**Created**: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss UTC')  
**Expected Duration**: 45 minutes  
**Stories**: 3 BUGs from PR #2 review  

## Overview

This issue triggers the bug-fix-automation skill on 3 real bugs discovered during PR #2 review:

1. **BUG-F37-001**: Row version not incremented on PUT
2. **BUG-F37-002**: Endpoint field format mismatch (ep['method'] doesn't exist)
3. **BUG-F37-003**: Missing api.cosmos module

Each bug goes through the DPDCA loop:
- **Phase A (Discover)**: Root Cause Analysis via LLM + data model queries
- **Phase B (Do)**: Generate and apply fix, verify test passes
- **Phase C (Act)**: Create prevention test, verify it catches the bug

## Manifest

<!-- SPRINT_MANIFEST
$manifestJson
-->

## Expected Output

After workflow completion, you should find:

- ✅ 3 Root Cause Analyses (BUG-F37-001-A.md, etc.) in .eva/evidence/
- ✅ 3 Bug Fixes (9 commits total: A + B + C per bug)
- ✅ 3 Prevention Tests (added to tests/ directory)
- ✅ 9 Evidence Receipts (BUG-F37-NNN-X-receipt.json)
- ✅ 1 Pull Request ready to review

## Success Criteria

- [ ] All 3 bugs have Phase A complete (RCA analysis)
- [ ] All 3 bugs have Phase B complete (Fix applied)
- [ ] All 3 bugs have Phase C complete (Prevention test created)
- [ ] 9 commits found in git log (feat/fix/test prefixes)
- [ ] All pytest gates pass (exit code 0)
- [ ] PR created and ready for review

## Performance Metrics

| Metric | Value |
|--------|-------|
| Automated | ~45 minutes |
| Manual | ~8-9 hours |
| Speedup | 11x |

## More Information

- Bug automation skill: \`.github/copilot-skills/bug-fix-automation.skill.md\`
- Bug automation agent: \`.github/scripts/bug_fix_agent.py\`
- Sprint manifest: \`.github/sprints/sprint-0.5-bug-fixes.md\`

---

**Triggered by**: Agent Copilot  
**Workflow**: .github/workflows/sprint-agent.yml  
**Labels**: bug-fix, sprint-task  
"@

# Prepare gh command
$ghCommand = @(
    "issue", "create",
    "--title", "[SPRINT-0.5] Bug-Fix Automation Demo",
    "--body", $issueBody,
    "--label", "sprint-task",
    "--label", "bug-fix",
    "--repo", "eva-foundry/37-data-model"
)

# Execute or dry-run
if ($DryRun) {
    Write-Host "[DRY-RUN] Would execute: gh $($ghCommand -join ' ')" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "[DRY-RUN] Issue body preview:" -ForegroundColor Cyan
    Write-Host ($issueBody | Select-Object -First 30)
    Write-Host ""
    Write-Host "[DRY-RUN] No issue created (use -DryRun `$false to execute)" -ForegroundColor Yellow
} else {
    Write-Host "[INFO] Creating GitHub issue to trigger Sprint 0.5..." -ForegroundColor Green
    Write-Host "[INFO] Command: gh $($ghCommand -join ' ')" -ForegroundColor Cyan
    Write-Host ""
    
    try {
        & gh @ghCommand
        Write-Host ""
        Write-Host "[PASS] Sprint 0.5 issue created successfully!" -ForegroundColor Green
        Write-Host "[INFO] Workflow will start within 60 seconds..."
        Write-Host "[INFO] Monitor at: https://github.com/marco-presta/eva-data-model/actions"
    } catch {
        Write-Error "Failed to create issue: $_"
        exit 1
    }
}
