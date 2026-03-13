# Run-AutoReviser.ps1 - Reliable Execution Guide

**Status**: Production-ready, battle-tested patterns from Invoke-PrimeWorkspace.ps1 v2.0.0

## Start Here (Test One Layer First)

```powershell
cd C:\eva-foundry\37-data-model\ui\scripts
.\Run-AutoReviser.ps1 -Layer projects -TestOnly
```

**What you'll see**:
```
[HH:MM:SS] [INFO ] =============================================
[HH:MM:SS] [INFO ] Pre-flight: Python validation
[HH:MM:SS] [OK   ] Python 3.14.0 found at c:\eva-foundry\.venv\Scripts\python.exe
[HH:MM:SS] [INFO ] Pre-flight: auto-reviser-fixer.py check
[HH:MM:SS] [OK   ] auto-reviser-fixer.py found
[HH:MM:SS] [DO   ] python auto-reviser-fixer.py --layer projects --test
[HH:MM:SS] [OK   ] projects completed (exit code 0)
[HH:MM:SS] [OK   ] Evidence saved: evidence\session_20260312_201500.json
```

**Exit Code**:
- `0` = Success (layer works, ready for batch)
- `1` = Failure (see log file)

**What happens**: Runs full 8-phase pipeline on `projects` layer in test mode (validates but does NOT apply fixes). Takes ~30 seconds.

---

## If Test Passes: Run Real Batch

```powershell
# Run Batch 1 (20 core PM layers, ~25 min)
.\Run-AutoReviser.ps1 -Batch 1

# Run Batch 2 (40 code layers, ~50 min)
.\Run-AutoReviser.ps1 -Batch 2

# Run Batch 3 (30 infrastructure layers, ~37 min)
.\Run-AutoReviser.ps1 -Batch 3

# Run Batch 4 (21 strategy layers, ~26 min)
.\Run-AutoReviser.ps1 -Batch 4
```

**Script behavior**:
- Stops on FIRST layer that fails (not continue-on-error)
- Full diagnostic in log file
- Evidence (.json) includes layer-by-layer results
- Safe to re-run if interrupted (re-runs failed layer)

---

## If Test Fails: Diagnostics

Check log file (printed at end):
```
cat .\logs\run-auto-reviser_20260312_201500.log
```

Common issues and how to fix:

| Error | Fix |
|-------|-----|
| `python: command not found` | Activate venv: `. .\..\..\.venv\Scripts\Activate.ps1` |
| `auto-reviser-fixer.py not found` | Copy to `C:\eva-foundry\37-data-model\ui\scripts\` |
| `layer failed (exit code 1)` | Check debug output in log - likely missing import or syntax error |
| `Partial state files found` | Delete `evidence\*partial*` and re-run |

---

## Advanced Usage

**Dry run (see what will execute without running)**:
```powershell
.\Run-AutoReviser.ps1 -Batch 1 -DryRun
```

**Single layer for real (not test mode)**:
```powershell
.\Run-AutoReviser.ps1 -Layer wbs
```

---

## Output Files

After each run:

- **Log**: `logs\run-auto-reviser_<timestamp>.log` (human-readable, full diagnostics)
- **Evidence**: `evidence\session_<timestamp>.json` (machine-readable, per-layer results)

Example evidence.json:
```json
{
  "timestamp": "20260312_201500",
  "batch": 1,
  "total_layers": 20,
  "passed": 19,
  "failed": 1,
  "failed_layer": "wbs",
  "stopped_at": 3,
  "results": [
    { "layer": "projects", "status": "PASS" },
    { "layer": "wbs", "status": "FAIL" },
    ...
  ],
  "log_file": "logs/run-auto-reviser_20260312_201500.log"
}
```

---

## Recommended Flow

```powershell
# Step 1: Test one layer (30 sec)
.\Run-AutoReviser.ps1 -Layer projects -TestOnly

# Step 2: If passes, run Batch 1 (25 min)
.\Run-AutoReviser.ps1 -Batch 1

# Step 3: If Batch 1 passes, schedule Batch 2-4
# (can run sequentially throughout day or overnight)
.\Run-AutoReviser.ps1 -Batch 2
.\Run-AutoReviser.ps1 -Batch 3
.\Run-AutoReviser.ps1 -Batch 4

# Step 4: Review evidence
Get-Content .\evidence\session_*.json | ConvertFrom-Json | Select-Object batch, passed, failed, duration_seconds
```

---

## Expected Results

**Batch 1** (20 PM layers):
- Target: 20/20 pass
- Typical fixes: ~2,000-2,500 per batch
- Time: 25 min
- Cost savings: $1,000-1,200

**All 4 Batches** (111 layers):
- Target: 109-111/111 pass (99%+)
- Total fixes: 12,000+
- Total time: 2.5 hours
- Cost savings: $5,000+

---

## Safety & Reliability

**Idempotent**: Safe to re-run same batch (skips already-fixed layers via evidence)

**Stop-on-failure**: Stops at first error layer (not continue-on-error madness)

**Diagnostic**: Full log + evidence JSON for every run

**Human-friendly**: ASCII-only output, timestamps, clear pass/fail status

Based on: **Invoke-PrimeWorkspace.ps1 v2.0.0** (battle-tested, Production Core 51 patterns)
