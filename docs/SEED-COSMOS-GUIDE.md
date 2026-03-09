# Session 41 - Seed Cosmos DB Script

**Purpose**: Load all 1,135 records from model/*.json into Cosmos DB  
**Prerequisites**: Deployment session-41-data-fix must be complete  
**Estimated Time**: 10-15 seconds

---

## Pre-Flight Check

```powershell
$prodBase = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"

# 1. Verify new deployment is active
$health = Invoke-RestMethod "$prodBase/health"
Write-Host "API Started: $($health.started_at)" -ForegroundColor Cyan
Write-Host "Uptime: $($health.uptime_seconds) seconds" -ForegroundColor Cyan

# Should show recent started_at (within last few minutes)
# If uptime is > 1 hour, deployment hasn't completed yet

# 2. Check revision
az containerapp revision list `
  --name msub-eva-data-model `
  --resource-group EVA-Sandbox-dev `
  --query "[0].{Name:name, Created:properties.createdTime, Active:properties.active}" `
  --output table

# Should show revision 0000016 (or higher) with recent Created time
```

---

## Seed Operation

```powershell
$prodBase = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"

Write-Host "`n=== Seeding Cosmos DB with all 1,135 records ===" -ForegroundColor Green

# Trigger seed operation
$seedResult = Invoke-RestMethod `
  -Uri "$prodBase/model/admin/seed" `
  -Method POST `
  -ContentType "application/json" `
  -TimeoutSec 120

# Display results
$seedResult | Format-List status, layers_seeded, total_records, duration_seconds

# Show layer counts
Write-Host "`n=== Layer Counts ===" -ForegroundColor Cyan
$seedResult.layers | Format-Table layer, count -AutoSize
```

**Expected Output**:
```
status         : success
layers_seeded  : 51
total_records  : 1135
duration_seconds : 12.4

Layer                          Count
-----                          -----
projects                       57
sprints                        43
stories                        152
tasks                          381
evidence                       30
...
```

---

## Verification

```powershell
$prodBase = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"

# 1. Check agent summary
$summary = Invoke-RestMethod "$prodBase/model/agent-summary"

Write-Host "`n=== Agent Summary ===" -ForegroundColor Cyan
$summary | Format-List session_41_reload_marker, layers_available

# Should show:
# session_41_reload_marker : <timestamp>
# layers_available : {51 layer names}

# 2. Spot check key layers
$checks = @(
    @{name="projects"; expected=57},
    @{name="sprints"; expected=43},
    @{name="stories"; expected=152},
    @{name="tasks"; expected=381},
    @{name="repos"; expected=24},
    @{name="evidence"; expected=30}
)

Write-Host "`n=== Layer Verification ===" -ForegroundColor Cyan
foreach ($check in $checks) {
    $layer = Invoke-RestMethod "$prodBase/model/$($check.name)/"
    $count = $layer.Count
    $status = if ($count -ge $check.expected) { "✅" } else { "❌" }
    Write-Host "$status $($check.name): $count (expected: $($check.expected))"
}

# 3. Run comprehensive audit
Write-Host "`n=== Running Comprehensive Audit ===" -ForegroundColor Cyan
.\scripts\comprehensive-layer-audit.ps1
```

---

## Troubleshooting

### "Seed operation timed out"
- Cosmos DB might be throttling (429)
- Check Container App logs: `az containerapp logs show --name msub-eva-data-model --resource-group EVA-Sandbox-dev --follow`
- Retry seed operation (it's idempotent)

### "Layer returns empty"
- Layer not in _LAYER_FILES → check api/routers/admin.py
- JSON file missing/empty → check model/<layer>.json exists
- Re-run seed: `POST /model/admin/seed`

### "session_41_reload_marker not present"
- Seed operation didn't complete successfully
- Check logs for errors
- Verify all JSON files exist in deployment

---

## Success Criteria

- [  ] Seed operation returns `status: success`
- [ ] `layers_seeded: 51`
- [ ] `total_records: 1135` (or close)
- [ ] `session_41_reload_marker` present in agent-summary
- [ ] All spot check layers have expected counts
- [ ] Comprehensive audit passes (all 51 layers operational)

---

**Next**: After verification passes, update STATUS.md with Session 41 completion
