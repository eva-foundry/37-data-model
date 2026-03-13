# Batch Orchestrator - Run Instructions

**Status**: Ready to run  
**Date**: March 12, 2026

---

## Quick Start

### Open PowerShell and run:

```powershell
cd C:\eva-foundry\37-data-model\ui\scripts

# Run Batch 1 (20 layers, ~25 minutes)
.\run-batch-orchestrator.ps1 -Batch 1

# If Batch 1 passes, run remaining batches
.\run-batch-orchestrator.ps1 -Batch 2,3,4

# Or run all at once
.\run-batch-orchestrator.ps1 -Batch all
```

---

## What Happens

For each layer:
1. ValidateTypeScript (catch errors)
2. Apply 6 fix patterns
3. Revalidate
4. Run Playwright E2E
5. Check quality gates (MTI > 70)
6. Write evidence to JSON

Output: Layer-by-layer logs + JSON evidence files

---

## Expected Output

```
[INFO] [15:30:45] [001/020] Processing layer: projects
[OK  ] projects: 150 fixes, MTI 89
[INFO] [15:31:42] [002/020] Processing layer: wbs
[OK  ] wbs: 210 fixes, MTI 87
...
[BATCH 1 SUMMARY]
[INFO] Passed: 20/20
[INFO] Total fixes: 2,043
[INFO] Avg MTI score: 87.3
[INFO] Cost savings: $1,200
```

---

## If Something Breaks

The error will tell you exactly where. Fix it and rerun. Sequential = easy to debug.

---

## Evidence Files

```
C:\eva-foundry\37-data-model\evidence\
├── auto-reviser_projects_20260312_153045.json
├── auto-reviser_wbs_20260312_153142.json
├── ...
└── batch-orchestrator_20260312_160200.json (summary)
```

---

## Commands Reference

```powershell
# Batch 1 only
.\run-batch-orchestrator.ps1 -Batch 1

# Batches 1 and 2
.\run-batch-orchestrator.ps1 -Batch 1,2

# All 4 batches
.\run-batch-orchestrator.ps1 -Batch all

# Dry-run (preview, no changes)
.\run-batch-orchestrator.ps1 -Batch 1 -Test

# Alternative: Direct Python
python scripts/batch-orchestrator-sequential.py --batch 1
python scripts/batch-orchestrator-sequential.py --all
```

---

## Do It

```powershell
cd C:\eva-foundry\37-data-model\ui\scripts
.\run-batch-orchestrator.ps1 -Batch 1
```

Go.
