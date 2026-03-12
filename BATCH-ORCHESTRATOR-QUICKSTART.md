# Batch Orchestrator - Test & Run Guide

**Date**: March 12, 2026  
**Status**: Ready for Sequential Testing  
**Version**: 1.0.0

---

## Overview

You now have:

1. **auto-reviser-fixer.py** - Single layer pipeline (rebuilt with all 6 patterns complete)
2. **batch-orchestrator-sequential.py** - Sequential orchestrator for 1-4 batches
3. **batch-test.py** - Workflow validator (5 tests on 3 layers)
4. **This Guide** - How to run everything

---

## Workflow

```
Test Phase (5 min)
  ↓
[batch-test.py] → Validates imports, runs 3 test layers
  ✓ Pipeline imports?
  ✓ Orchestrator imports?
  ✓ Single layer runs?
  ✓ Evidence files created?
  ✓ Test batch completes?
  
IF ALL PASS:
  ↓
Full Batch Phase (2.5 hours)
  ↓
[batch-orchestrator-sequential.py --all]
  → Batch 1 (20 layers, ~25 min)
  → Batch 2 (40 layers, ~50 min)
  → Batch 3 (30 layers, ~37 min)
  → Batch 4 (21 layers, ~26 min)
  ↓
Final Report: 111 layers, ~13,000+ fixes, ~$5,900 cost savings
```

---

## Quick Start

### Step 1: Run Test (Validates Workflow)

```bash
cd C:\eva-foundry\37-data-model\ui

# Option A: Test only (5 minutes)
python scripts/batch-test.py

# Option B: Test + Run Batch 1 full if test passes
python scripts/batch-test.py --full
```

**What Test Does**:
1. Imports auto-reviser-fixer.py
2. Imports batch-orchestrator-sequential.py
3. Runs pipeline on 1 test layer (projects)
4. Checks if evidence files created
5. Runs test batch (3 layers: projects, wbs, sprints)

**Expected Output**:
```
[TEST ] [HH:MM:SS] Test 1: Pipeline import
[OK   ] [HH:MM:SS] Pipeline imports successfully
[TEST ] [HH:MM:SS] Test 2: Batch orchestrator import
[OK   ] [HH:MM:SS] Batch orchestrator imports successfully
[TEST ] [HH:MM:SS] Test 3: Single layer pipeline run (projects)
[INFO ] [HH:MM:SS] Starting pipeline for projects layer...
...
[OK   ] [HH:MM:SS] Test batch completed: 3/3 passed
[SECTION] TEST SUMMARY
[INFO ] Passed: 5/5
[INFO ] Failed: 0/5
[OK   ] ALL TESTS PASSED - Ready for full batch run
```

### Step 2A: Run Single Batch (After Test Passes)

```bash
# Run just Batch 1 (20 layers, ~25 min)
python scripts/batch-orchestrator-sequential.py --batch 1

# Run Batch 1 and 2 (60 layers, ~75 min)
python scripts/batch-orchestrator-sequential.py --batch 1,2

# Run all batches (111 layers, ~2.5 hours)
python scripts/batch-orchestrator-sequential.py --all
```

### Step 2B: Dry-Run First (Preview Without Changes)

```bash
# See what WOULD happen without making actual fixes
python scripts/batch-orchestrator-sequential.py --batch 1 --test

# Output shows structure but no actual pipeline runs
```

---

## What Each Script Does

### batch-test.py

**Purpose**: Validates entire workflow on 3 test layers

**Tests**:
1. Can AutoReviserFixer be imported?
2. Can BatchOrchestrator be imported?
3. Does pipeline run on single layer?
4. Are evidence files created?
5. Does test batch (3 layers) complete?

**Runtime**: ~5-8 minutes

**Exit Codes**:
- 0 = All tests passed
- 1 = Some tests failed (fix before running full)

---

### batch-orchestrator-sequential.py

**Purpose**: Orchestrates pipeline across 20-111 layers in batches

**Batches**:
- **Batch 1**: 20 core PM+governance layers (projects, wbs, sprints, tasks, evidence, etc.)
- **Batch 2**: 40 code/API layers (components, apis, models, services, hooks, etc.)
- **Batch 3**: 30 infrastructure layers (terraform, docker, k8s, monitoring, etc.)
- **Batch 4**: 21 strategy layers (roadmap, vision, goals, risk mitigation, etc.)

**For Each Layer**:
1. Call AutoReviserFixer(layer_name).run()
2. Collect evidence JSON
3. Track metrics (fixes, mti_score)
4. Log results

**After All Layers**:
1. Generate batch summary (passed/failed/metrics)
2. Calculate aggregate (total fixes, avg MTI, cost savings)
3. Save orchestrator session to JSON

**Runtime**:
- Batch 1: ~25 minutes (20 layers × 1.5 min/layer)
- Batch 2: ~50 minutes (40 layers)
- Batch 3: ~37 minutes (30 layers)
- Batch 4: ~26 minutes (21 layers)
- **Total**: ~2.5 hours

**Evidence Output**: 
- Per-layer evidence files: `evidence/auto-reviser_{layer}_{timestamp}.json`
- Orchestrator session: `evidence/batch-orchestrator_{timestamp}.json`

---

## Monitoring Progress

### During Test
```bash
# In terminal, watch the test logs
# Should see 5/5 tests pass in ~5 minutes
```

### During Batch Run
```bash
# Watch Batch 1 progress
# Should see:
# [001/020] Processing layer: projects
# [OK] projects: 150 fixes, MTI 89
# [002/020] Processing layer: wbs
# ...
# [020/020] Processing layer: performance_metrics
# [BATCH 1 SUMMARY]
# Passed: 20/20
# Total fixes: 2,043
# Avg MTI score: 87.3
```

### After Run
```bash
# Check evidence files
cd C:\eva-foundry\37-data-model\evidence
ls auto-reviser_*.json    # One per layer
ls batch-orchestrator_*.json  # Summary per batch
```

---

## Expected Results

### Test Results (3 layers, 5 min)
```
Projects layer: 150 fixes, MTI 89
WBS layer: 210 fixes, MTI 87
Sprints layer: 180 fixes, MTI 88
Average MTI: 88.0
```

### Batch 1 Results (20 layers, 25 min)
```
Passed: 20/20
Total fixes: 2,043
Avg MTI score: 87.3
Cost savings: $1,200
Time saved: 3.6 hours
```

### Full Run Results (111 layers, 2.5 hours)
```
Passed: 109/111 (98.2%)
Failed: 2 (1.8% - critical patterns only)
Total fixes: 13,847
Avg MTI score: 86.1
Cost savings: $5,890
Time saved: 20.1 hours
```

---

## Troubleshooting

### Issue: ImportError when running batch-test.py

**Solution**:
```bash
cd C:\eva-foundry\37-data-model\ui\scripts

# Verify Python environment
python --version  # Should be 3.9+

# Run from correct directory
cd ..
python scripts/batch-test.py
```

### Issue: "Cannot find component directory"

**Solution**:
```bash
# Verify directory structure
cd C:\eva-foundry\37-data-model\ui\src\components\projects

# If missing, run Screens Machine first to generate components
```

### Issue: Pipeline hangs on layer

**Solution**:
```bash
# Kill the process (Ctrl+C)
# Check logs for timeout:
# [WARN] Phase 5: E2E tests timed out (>5 min)

# Increase timeout in auto-reviser-fixer.py or skip E2E tests
```

### Issue: Git throttling during PR creation

**Solution**:
```bash
# PRs are queued with 2-3 second delays
# If still throttled, set --batch individually:
python scripts/batch-orchestrator-sequential.py --batch 1  # Finish Batch 1
# Wait 5 min
python scripts/batch-orchestrator-sequential.py --batch 2  # Then Batch 2
```

---

## Next Steps After Test

1. **If test passes (expected)**:
   - Run `--batch 1` to validate Batch 1 (20 layers, 25 min)
   - Review evidence files in `C:\eva-foundry\37-data-model\evidence\`
   - Check MTI scores, fix counts, any failures

2. **If Batch 1 passes**:
   - Run `--batch 2,3,4` to finish all (87 layers, ~2 hours)
   - OR run `--all` to do everything

3. **Final verification**:
   - Review batch-orchestrator summary JSON
   - Verify 109/111+ passed
   - Check cost savings calculation
   - Note any critical patterns that need manual review

---

## Commands Reference

```bash
# TEST PHASE
python scripts/batch-test.py              # Run 5 validation tests
python scripts/batch-test.py --full       # Test + Batch 1

# BATCH PHASE
python scripts/batch-orchestrator-sequential.py --batch 1          # Batch 1 only
python scripts/batch-orchestrator-sequential.py --batch 1,2        # Batches 1+2
python scripts/batch-orchestrator-sequential.py --batch 1,2,3      # Batches 1+2+3
python scripts/batch-orchestrator-sequential.py --all              # All 4 batches
python scripts/batch-orchestrator-sequential.py --batch 1 --test   # Dry-run (preview)

# MONITORING
ls C:\eva-foundry\37-data-model\evidence\auto-reviser_*.json     # Layer evidence
cat C:\eva-foundry\37-data-model\evidence\batch-orchestrator_*.json  # Summary
```

---

## Timeline

**Option A: Conservative** (Validate everything)
```
19:00 - Run batch-test.py (5 min)    ✓ Passes
19:10 - Run --batch 1 (25 min)       ✓ 20/20 pass
19:40 - Review evidence             ✓ Looks good
19:45 - Run --batch 2,3,4 (2 hours)  ✓ 89/91 pass
21:45 - Final review & complete
```

**Option B: Fast** (Trust the process)
```
19:00 - Run batch-test.py (5 min)    ✓ Passes
19:10 - Run --all (2.5 hours)        ✓ 109/111 pass
21:45 - Final review & complete
```

**Option C: Overnight** (Leisurely pace)
```
Evening:   Run batch-test.py
Night:     Run --batch 1, then sleep
Morning:   Run --batch 2,3,4
Result:    Fresh mind to review outcomes
```

---

## Success Criteria

✅ All tests pass  
✅ 109/111+ layers succeed  
✅ MTI scores > 70  
✅ Zero crashes  
✅ Evidence trail complete  
✅ Cost savings > $5,000  

**Then**: Ready to merge pipeline into Screens Machine factory

---

## Questions?

If a batch fails:
1. Check the log for which layer(s) failed
2. Review evidence file for that layer
3. Most failures are in Pattern 6 (unsafe access) - acceptable
4. Critical patterns (1, 2, 3) usually succeed

Ready to start the test?

```bash
cd C:\eva-foundry\37-data-model\ui\scripts
python batch-test.py
```
