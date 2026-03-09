# Phase 2 Quick Start - Evidence Sync Automation

**Status**: 🔴 PENDING ACTIVATION (files created, awaiting git commit)  
**Last Updated**: 2026-03-03 (Phase 1 backfill: ✅ 63 records done)

---

## What's Done ✅

✅ **Phase 1**: Evidence backfilled (63 records from 51-ACA to 37-data-model)  
✅ **Phase 2 Framework**: Automation layer complete (GitHub Actions, Azure Pipelines, wrappers)  
⏳ **Phase 2 Activation**: Awaiting git commit/push

---

## Activate Phase 2 (5 minutes)

### Step 1: Commit Phase 2 Files
```bash
cd C:\AICOE\eva-foundry\37-data-model

# Stage all Phase 2 files
git add .github/workflows/sync-51-aca-evidence.yml
git add azure-pipelines.yml
git add scripts/sync-evidence.ps1
git add scripts/sync-evidence.sh
git add docs/CI-CD-INTEGRATION-GUIDE.md
git add docs/PHASE-2-SYNC-AUTOMATION-COMPLETE.md

# Commit with message
git commit -m "feat: Phase 2 evidence sync automation

- GitHub Actions: Daily at 08:00 UTC
- Azure Pipelines: Multi-stage pipeline
- Wrapper scripts: PowerShell, Bash support
- Integration guide: All platforms documented
- Phase 1 evidence preserved: 63 records, 100% valid"

# Push to main
git push origin main
```

### Step 2: Verify Workflow Registration (GitHub)
```bash
# Option A: Via browser
# 1. Go to https://github.com/<owner>/eva-foundry
# 2. Click Actions tab
# 3. Should see "Sync Evidence from 51-ACA" workflow in the list
# 4. Next run: 2026-03-04 at 08:00 UTC (automatic)

# Option B: Via CLI
gh workflow list
gh workflow view "Sync Evidence from 51-ACA"
```

### Step 3: Test Workflow (Optional)
```bash
# Manually trigger workflow from GitHub UI
# 1. Actions tab → "Sync Evidence from 51-ACA"
# 2. "Run workflow" button → Branch: main → "Run workflow"
# 3. Monitor execution (should show "No changes" since Phase 1 synced already)
# 4. Check summary report for status

# Or via CLI
gh workflow run sync-51-aca-evidence.yml
```

---

## Files Created (Phase 2)

| File | Type | Purpose | Size |
|------|------|---------|------|
| `.github/workflows/sync-51-aca-evidence.yml` | YAML | GitHub Actions workflow | 180+ lines |
| `azure-pipelines.yml` | YAML | Azure Pipelines config | 450+ lines |
| `scripts/sync-evidence.ps1` | PowerShell | Windows wrapper | 150+ lines |
| `scripts/sync-evidence.sh` | Bash | Linux/macOS wrapper | 250+ lines |
| `docs/CI-CD-INTEGRATION-GUIDE.md` | Markdown | All platforms guide | 800+ lines |
| `docs/PHASE-2-SYNC-AUTOMATION-COMPLETE.md` | Markdown | Phase 2 completion report | 500+ lines |

**Total**: 6 files, 2,330+ lines

---

## What Happens After Commit

### Automatic (no action needed)
- ✅ GitHub Actions workflow registers automatically
- ✅ First scheduled run: 2026-03-04 at 08:00 UTC
- ✅ Daily automatic sync thereafter
- ✅ Changes auto-committed to main (if any)

### Manual Triggers (anytime)
```bash
# GitHub Actions
gh workflow run sync-51-aca-evidence.yml

# Azure Pipelines
# Click "Run pipeline" button in Azure DevOps UI
```

### Monitoring
- **GitHub**: Actions tab → workflow execution history
- **Azure**: Pipelines → Build history
- **Git**: Check commits for `[skip ci]` messages from bot

---

## Expected Behavior

### Normal Execution (when no new evidence in 51-ACA)
```
[✓] Checkout repos
[✓] Run sync script
[✓] Validate schema
[✓] Check merge gates
[✓] No changes to commit
[✓] Report: "No new records"
Status: SUCCESS (no changes)
```

### With New Evidence (when 51-ACA has new records)
```
[✓] Checkout repos
[✓] Run sync script
[✓] Validate schema
[✓] Check merge gates
[✓] Commit & push changes
[✓] Report: "X records synced"
Status: SUCCESS (changes committed)
```

### Failure (merge-blocking issues)
```
[✓] Checkout repos
[✓] Run sync script
[✓] Validate schema
[⚠] Merge gates: X test failures, Y lint failures
[!] Changes NOT committed (safety gate)
Status: FAILURE (fix required before merge)
```

---

## Multi-Platform Options

### GitHub Actions (Recommended) ✅
- **File**: `.github/workflows/sync-51-aca-evidence.yml`
- **Trigger**: Schedule + Manual
- **Status**: Ready to deploy (after git push)

### Azure Pipelines ✅
- **File**: `azure-pipelines.yml`
- **Trigger**: Schedule + Manual
- **Setup**: Push file, configure in Azure DevOps UI

### Other Platforms ✅
See `docs/CI-CD-INTEGRATION-GUIDE.md` for:
- GitLab CI/CD
- Jenkins (Declarative)
- CircleCI
- Local command-line usage

---

## Phase 1 Data Preserved ✅

**Records**: 63 (all still in evidence.json)  
**Validation**: 100% PASS against schema  
**Merge Gates**: 0 failures (test_result=PASS, lint_result=SKIP)  
**Coverage**: 7 epics (ACA-02, ACA-03, ACA-04, ACA-06, ACA-14, ACA-15, ACA-17)

---

## FAQ

**Q: Will my Phase 1 evidence be overwritten?**  
A: No. Phase 2 uses deduplication - same evidence is skipped, only NEW evidence is added.

**Q: What if the sync fails?**  
A: Changes are NOT committed (safety gate). You'll see error in workflow logs.

**Q: Can I run sync manually from command line?**  
A: Yes! Use wrapper scripts:
```powershell
.\scripts\sync-evidence.ps1 -AutoCommit  # PowerShell
```
```bash
./scripts/sync-evidence.sh --auto-commit   # Bash
```

**Q: When's the first automatic run?**  
A: Tomorrow at 08:00 UTC (after pushing to main).

**Q: Can I change the schedule?**  
A: Yes! Edit the cron in `.github/workflows/sync-51-aca-evidence.yml` (line ~7):
```yaml
cron: '0 8 * * *'  # Change 8 to your preferred hour
```

---

## Troubleshooting

### Workflow doesn't appear in Actions tab
```bash
git push origin main
# Wait 2-3 minutes for GitHub to register
# Refresh Actions tab in browser
```

### Merge-blocking failures
```bash
# Check sync report for details
cat sync-evidence-report.json | jq .

# Review evidence records with failures
grep -i "FAIL" model/evidence.json
```

### Manual test shows "No changes"
```bash
# This is EXPECTED if Phase 1 already synced everything
# Means sync is working correctly (no new evidence in 51-ACA)
```

---

## Next Steps

### Immediate
- [ ] Run git commit/push (5 min)
- [ ] Verify workflow in Actions tab (2 min)
- [ ] Optional: Manual test (5 min)

### Tomorrow
- [ ] Check first automatic execution (08:00 UTC)
- [ ] Verify auto-commit appears in git history

### Week
- [ ] Phase 3 planning: Multi-project scaling

### Future
- [ ] Phase 4: Insurance compliance reports
- [ ] Discussion agent refactoring (API-first)

---

## Documentation Index

- **Phase 1 Results**: `docs/PHASE-1-EVIDENCE-BACKFILL-REPORT.md`
- **Phase 2 Complete**: `docs/PHASE-2-SYNC-AUTOMATION-COMPLETE.md` (this document)
- **Gap Analysis**: `docs/EVIDENCE-LAYER-EVOLUTION-GAP-ANALYSIS.md`
- **CI/CD Guide**: `docs/CI-CD-INTEGRATION-GUIDE.md`
- **Workflow File**: `.github/workflows/sync-51-aca-evidence.yml`
- **Azure Config**: `azure-pipelines.yml`

---

**Questions?** See full documentation in `docs/PHASE-2-SYNC-AUTOMATION-COMPLETE.md`

**Ready?** Run:
```bash
cd C:\AICOE\eva-foundry\37-data-model
git add . && git commit -m "feat: Phase 2 automation" && git push origin main
```
