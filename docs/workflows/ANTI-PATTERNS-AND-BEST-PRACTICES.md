# GitHub Actions Workflow Anti-Patterns & Best Practices

**For**: EVA Foundation - Project 37 (Data Model)  
**Context**: Session 39 DPDCA Fix - Infrastructure Monitoring Workflow  
**Date**: 2026-03-08  
**Reference**: Project 51 (ACA) workflow patterns

---

## Executive Summary

After fixing multiple workflow failures (PRs #39, #40, #41), we identified critical anti-patterns in GitHub Actions orchestration. This document captures lessons learned and best practices from Project 51's mature workflow implementations.

**Key Learning**: Workflow orchestration requires understanding GitHub Actions' **step isolation model** - each step runs in a new shell session with isolated state.

---

## Critical Anti-Patterns

### ❌ Anti-Pattern 1: Cross-Step Exit Code Checking

**What We Did Wrong:**
```yaml
- name: Run sync script
  shell: pwsh
  run: |
    .\sync-script.ps1  # exits with code 0 or 1

- name: Check if previous step succeeded
  shell: pwsh
  run: |
    if ($LASTEXITCODE -eq 0) {  # ❌ UNDEFINED!
      Write-Host "Success"
    } else {
      exit 1
    }
```

**Why It Failed:**
- Each workflow step = **new shell session**
- `$LASTEXITCODE` (PowerShell) and `$?` (Bash) **don't persist** across steps
- The "Report status" step sees undefined/null, not the actual exit code
- Workflow shows SUCCESS in "Run sync" but FAILURE in "Report status"

**Evidence from Session 39:**
```
✓ Run cost sync        [SUCCESS]  # Script completed, exit 0
✗ Report sync status   [FAILURE]  # $LASTEXITCODE undefined
```

**The Fix:**
```yaml
# Option A: Remove redundant status checks (our approach)
- name: Run sync script
  shell: pwsh
  run: |
    .\sync-script.ps1  # GitHub Actions handles exit code automatically

# Option B: Use step outcomes (Project 51 pattern)
- name: Run sync script
  id: sync
  shell: pwsh
  continue-on-error: true
  run: |
    .\sync-script.ps1

- name: Report status
  if: always()
  run: |
    if [[ "${{ steps.sync.outcome }}" == "success" ]]; then
      echo "✓ Sync succeeded"
    else
      echo "✗ Sync failed"
      exit 1
    fi
```

**Best Practice:**
- ✅ Let GitHub Actions handle exit codes natively (shows ✓/✗ automatically)
- ✅ If custom reporting needed, use `steps.<id>.outcome` or `steps.<id>.conclusion`
- ✅ Never check `$LASTEXITCODE` or `$?` across step boundaries

---

### ❌ Anti-Pattern 2: Missing Explicit Exit Codes in Scripts

**What We Did Wrong:**
```powershell
# Script: sync-data.ps1
try {
    $result = Invoke-SomeOperation
    Write-Host "✓ Operation complete"
    # ❌ No explicit exit - shell assumes success but LASTEXITCODE undefined
} catch {
    Write-Error "✗ Failed: $_"
    exit 1  # Only exits on error
}
```

**Why It Failed:**
- PowerShell doesn't auto-set `$LASTEXITCODE = 0` on function return
- Script completes without error, but exit code is undefined
- Workflow status checkers see null/undefined instead of 0

**The Fix:**
```powershell
# Script: sync-data.ps1
try {
    $result = Invoke-SomeOperation
    Write-Host "✓ Operation complete"
    exit 0  # ✅ Explicit success exit
} catch {
    Write-Error "✗ Failed: $_"
    exit 1
}
```

**Best Practice:**
- ✅ **Always** include explicit `exit 0` on success paths
- ✅ Bash scripts: End with `exit 0` or use `set -e` to auto-fail on errors
- ✅ PowerShell: Explicit `exit 0` at end of successful execution
- ✅ Python: Use `sys.exit(0)` or return exit codes from main()

---

### ❌ Anti-Pattern 3: Single-Step Workflows Without Evidence

**What We Did Wrong:**
```yaml
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: |
          python sync-script.py
          # ❌ No artifacts, no evidence, no trace if it fails
```

**Why It's Bad:**
- No audit trail of what was executed
- No artifacts to review on failure
- Can't reproduce issues locally
- No correlation ID for debugging distributed systems

**Project 51's Approach (Epic 15):**
```yaml
jobs:
  deploy:
    outputs:
      correlation_id: ${{ steps.trigger.outputs.correlation_id }}
    steps:
      - name: Trigger job
        id: trigger
        run: |
          CORRELATION_ID="ACA-EPIC15-$(date +%Y%m%d-%H%M)-${{ github.run_id }}"
          echo "correlation_id=$CORRELATION_ID" >> $GITHUB_OUTPUT
          # Use CORRELATION_ID in job execution

  record-evidence:
    needs: deploy
    if: always()
    steps:
      - name: Create evidence receipt
        run: |
          cat > evidence.json <<EOF
          {
            "correlation_id": "${{ needs.deploy.outputs.correlation_id }}",
            "timestamp": "$(date -u +'%Y-%m-%dT%H:%M:%SZ')",
            "github_run_url": "${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}",
            "status": "${{ needs.deploy.conclusion }}"
          }
          EOF
      
      - uses: actions/upload-artifact@v4
        with:
          name: evidence-${{ github.run_id }}
          path: evidence.json
          retention-days: 30
```

**Best Practice:**
- ✅ Generate correlation IDs for tracing
- ✅ Create evidence receipts with metadata (timestamps, URLs, outcomes)
- ✅ Upload artifacts for post-mortem analysis
- ✅ Use `if: always()` for evidence collection (runs even on failure)
- ✅ Link workflow runs to external systems (e.g., Story IDs, WBS IDs)

---

### ❌ Anti-Pattern 4: Failing Fast Without Collection

**What We Did Wrong:**
```yaml
- name: Lint check
  run: ruff check .
  # ❌ Fails immediately, never runs tests

- name: Run tests
  run: pytest
  # Never executed if lint fails
```

**Why It's Bad:**
- Only see first failure
- Must fix → rerun → discover next issue (serial debugging)
- Wastes CI time and developer cycles

**Project 51's DPDCA Agent Pattern:**
```yaml
- name: C -- Ruff lint
  continue-on-error: true
  run: |
    ruff check services/ --quiet 2>&1 | tee lint-result.txt
    LINT_EXIT=${PIPESTATUS[0]}
    echo "LINT_STATUS=$LINT_EXIT" >> "$GITHUB_ENV"
    [ "$LINT_EXIT" = "0" ] && echo "[PASS]" || echo "[WARN]"

- name: C -- Pytest collect
  continue-on-error: true
  run: |
    pytest services/ --co -q 2>&1 | tee test-collect.txt
    TEST_EXIT=${PIPESTATUS[0]}
    echo "TEST_STATUS=$TEST_EXIT" >> "$GITHUB_ENV"

- name: C -- Update evidence with check results
  run: python3 .github/scripts/dpdca_evidence.py update

- name: A -- Commit results
  run: |
    git add lint-result.txt test-collect.txt
    LINT=${{ env.LINT_STATUS }}
    TEST=${{ env.TEST_STATUS }}
    # Both results available for decision-making
```

**Best Practice:**
- ✅ Use `continue-on-error: true` for check steps
- ✅ Capture all results to files (tee command)
- ✅ Store exit codes in `$GITHUB_ENV` for later decisions
- ✅ Collect ALL evidence before failing workflow
- ✅ Upload artifacts with all check outputs

---

### ❌ Anti-Pattern 5: No Job-to-Job Communication

**What We Did Wrong:**
```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: |
          VERSION=$(date +%Y%m%d-%H%M)
          docker build -t app:$VERSION .
          # ❌ VERSION lost, can't deploy this exact image

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - run: docker deploy app:???  # Which version???
```

**Why It Failed:**
- Job outputs not captured
- Can't pass data between jobs
- Must reconstruct state or use hardcoded values

**Project 51's Pattern:**
```yaml
jobs:
  build-and-push:
    outputs:
      image_tag: ${{ steps.image.outputs.tag }}
    steps:
      - name: Generate image tag
        id: image
        run: |
          TAG=$(date +%Y%m%d-%H%M)
          echo "tag=${TAG}" >> $GITHUB_OUTPUT  # ✅ Store in output

      - name: Build image
        run: docker build -t app:${{ steps.image.outputs.tag }} .

  deploy-job:
    needs: build-and-push
    steps:
      - name: Deploy
        run: |
          IMAGE="${{ needs.build-and-push.outputs.image_tag }}"  # ✅ Use from previous job
          az deploy --image "registry.io/app:$IMAGE"
```

**Best Practice:**
- ✅ Define `outputs:` at job level
- ✅ Use `echo "key=value" >> $GITHUB_OUTPUT` in steps
- ✅ Reference outputs: `${{ needs.<job>.outputs.<key> }}`
- ✅ Pass artifacts via `upload-artifact` / `download-artifact` for files

---

## Project 51 Best Practices Summary

### Evidence-Driven Workflow Pattern

Project 51's DPDCA agent demonstrates mature evidence collection:

```yaml
jobs:
  dpdca:
    steps:
      # D1 - Discover: Load context
      - name: D1 -- Load project context
        run: |
          cat PLAN.md STATUS.md .github/copilot-instructions.md > context.txt

      # P - Plan: Generate via LLM
      - name: P -- Generate plan
        run: python3 scripts/dpdca_plan.py

      # D2 - Do: Execute
      - name: D2 -- Write evidence receipt
        run: python3 scripts/dpdca_evidence.py write

      # C - Check: Collect all results
      - name: C -- Lint
        continue-on-error: true
        run: ruff check . | tee lint.txt

      - name: C -- Test
        continue-on-error: true
        run: pytest --co | tee test.txt

      - name: C -- Update evidence
        run: python3 scripts/dpdca_evidence.py update

      # A - Act: Commit, PR, notify
      - name: A -- Upload artifacts
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: dpdca-${{ env.STORY_ID }}-artifacts
          path: |
            agent-plan.md
            lint.txt
            test.txt
            .eva/evidence/
          retention-days: 30
```

### Key Patterns:

1. **Correlation IDs**: `ACA-EPIC15-20260308-1430-12345`
2. **Evidence Receipts**: JSON files with metadata, timestamps, URLs
3. **Artifact Upload**: `if: always()` ensures evidence even on failure
4. **Status Passing**: Environment variables + job outputs
5. **Context Loading**: Read governance docs into context for LLMs
6. **Non-Blocking Deployment**: Trigger Azure Container Apps Job, return immediately

---

## Recommended Workflow Template

Based on Session 39 fixes and Project 51 patterns:

```yaml
name: EVA Data Sync - Production Pattern

on:
  schedule:
    - cron: '0 */4 * * *'
  workflow_dispatch:
    inputs:
      dry_run:
        type: boolean
        default: false

env:
  DATA_MODEL_URL: https://api.example.com

jobs:
  sync:
    runs-on: ubuntu-latest
    outputs:
      correlation_id: ${{ steps.setup.outputs.correlation_id }}
      records_synced: ${{ steps.sync.outputs.records }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup correlation ID
        id: setup
        run: |
          CID="SYNC-$(date +%Y%m%d-%H%M)-${{ github.run_id }}"
          echo "correlation_id=$CID" >> $GITHUB_OUTPUT
          echo "CORRELATION_ID=$CID" >> $GITHUB_ENV
      
      - name: Azure login
        uses: azure/login@v2
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      
      - name: Run sync
        id: sync
        working-directory: scripts
        shell: pwsh
        run: |
          $records = .\sync-data.ps1 -CorrelationId "${{ env.CORRELATION_ID }}"
          echo "records=$records" >> $env:GITHUB_OUTPUT
          # Script includes explicit 'exit 0' on success
      
      - name: Upload sync log
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: sync-log-${{ steps.setup.outputs.correlation_id }}
          path: sync-*.log
          retention-days: 30

  evidence:
    needs: sync
    if: always()
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Create evidence receipt
        run: |
          cat > evidence.json <<EOF
          {
            "correlation_id": "${{ needs.sync.outputs.correlation_id }}",
            "timestamp": "$(date -u +'%Y-%m-%dT%H:%M:%SZ')",
            "github_run_url": "${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}",
            "job_status": "${{ needs.sync.result }}",
            "records_synced": ${{ needs.sync.outputs.records_synced || 0 }},
            "dry_run": ${{ inputs.dry_run || false }}
          }
          EOF
          cat evidence.json
      
      - uses: actions/upload-artifact@v4
        with:
          name: evidence-${{ needs.sync.outputs.correlation_id }}
          path: evidence.json
          retention-days: 90
```

---

## Quick Reference: What Not To Do

| ❌ Anti-Pattern | ✅ Best Practice |
|----------------|-----------------|
| Check `$LASTEXITCODE` across steps | Use `steps.<id>.outcome` or native exit handling |
| Omit `exit 0` in scripts | Always include explicit `exit 0` |
| Single-step workflows | Multi-job with evidence collection |
| Fail on first error | `continue-on-error: true` + collect all |
| No correlation IDs | Generate and propagate IDs |
| No artifacts on failure | `if: always()` + upload artifacts |
| Hardcoded values between jobs | Job `outputs:` + `needs.<job>.outputs.<key>` |
| Inline status checking | Separate evidence/reporting job |

---

## Validation Checklist

Before merging a workflow:

- [ ] All scripts have explicit `exit 0` on success
- [ ] No cross-step `$LASTEXITCODE` or `$?` checks
- [ ] Correlation ID generated and propagated
- [ ] Evidence receipt created with metadata
- [ ] Artifacts uploaded with `if: always()`
- [ ] Check steps use `continue-on-error: true`
- [ ] Job outputs defined for inter-job communication
- [ ] Secrets properly scoped (not in logs)
- [ ] Dry-run mode available
- [ ] Link to GitHub run URL in evidence

---

## Related Documentation

- Session 39 PRs: #39 (parser error), #40 (exit codes), #41 (workflow fix)
- Project 51 Workflows: `51-ACA/.github/workflows/`
- Project 37 Permissions: `docs/github-actions-permissions-setup.md`
- DPDCA Methodology: Foundation Layer governance docs

---

**Last Updated**: 2026-03-08  
**Authors**: Session 39 DPDCA Fix, EVA AI COE  
**Status**: Validated in production (L42, L49 working; L41 pending permissions)
