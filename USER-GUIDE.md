# EVA Data Model - Agent User Guide

**Version:** 3.1  
**Last Updated:** March 6, 2026 11:12 AM ET  
**Audience:** AI agents (GitHub Copilot, Claude, custom skills)

---

## The One Instruction

**Call the agent guide endpoint to get the complete user guide:**

```powershell
# Cloud (production)
$base = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"
Invoke-RestMethod "$base/model/agent-guide" | ConvertTo-Json -Depth 10

# Local (development)
$base = "http://localhost:8010"
Invoke-RestMethod "$base/model/agent-guide" | ConvertTo-Json -Depth 10
```

**The API response contains everything you need:**
- Bootstrap sequence (5-step discovery journey)
- Query capabilities (universal params, filters, pagination)
- Write cycle (PUT rules, commit workflow, actor headers)
- Common mistakes (8 lessons learned with fixes)
- Forbidden actions (what NOT to do)
- Quick reference (all endpoints)

---

## Session State Management (CRITICAL)

Every agent session must establish `$session` object with API bootstrap. This solves the "where is $base stored?" problem.

### Initialize Once Per Session

Run this PowerShell sequence at the START of your agent session:

```powershell
# Session initialization (run once at start)
$session = @{
    base = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"
    initialized_at = Get-Date
    guide = $null
}

# Fetch authoritative guidance from Cosmos DB
try {
    $session.guide = Invoke-RestMethod "$($session.base)/model/agent-guide" -TimeoutSec 10
    Write-Host "[INFO] Bootstrap complete. $(($session.guide.layers_available | Measure-Object).Count) layers online."
} catch {
    Write-Error "[FAIL] API bootstrap failed: $_"
    exit 1
}

# Now $session is ready for all operations
Write-Host "[INFO] Session established. Use `$session.guide for all patterns and rules."
```

### Refresh If Session > 4 Hours

```powershell
if ((Get-Date) - $session.initialized_at | Select-Object -ExpandProperty TotalHours | Where-Object {$_ -gt 4}) {
    Write-Host "[WARN] Session > 4 hours. Refreshing guide from API..."
    $session.guide = Invoke-RestMethod "$($session.base)/model/agent-guide" -TimeoutSec 10
}
```

### Use $session For All Queries

After bootstrap, ALWAYS use `$session` to access base URL and guidance patterns:

```powershell
# Query using established session
$projects = (Invoke-RestMethod "$($session.base)/model/projects/?limit=100").data

# Access patterns from guide
$safe_limit = $session.guide.query_capabilities.universal_params.limit  # "All layers support ?limit=N"

# Read write rules from guide
$rules = $session.guide.write_cycle  # Array of 5 rules with examples
```

---

## Why This Approach?

The `GET /model/agent-guide` endpoint is the **single source of truth** for agent guidance. This markdown file documents HOW to use it.

**Benefits:**
- ✅ Always up to date (API updated with code changes, picked up instantly)
- ✅ No sync drift between docs and implementation
- ✅ Self-documenting (modify api/server.py to update guidance)
- ✅ Includes live examples with current data counts
- ✅ 41 operational layers queried live (not hardcoded)

---

## ⚠️ BEFORE YOUR FIRST QUERY: Terminal Safety Rules

Large API responses can scramble PowerShell output. **Every example below follows these rules:**

### Rule 1: Always Use `?limit=N`
- Default: `?limit=100`
- Maximum: `?limit=1000`
- **Never query without a limit** (terminal table overflow risk)

❌ Wrong: `(irm $base/model/endpoints/).data | Format-Table`  
✅ Correct: `(irm "$base/model/endpoints/?limit=20").data | Select-Object id,status | Format-Table`

### Rule 2: Always Access `.data` Property

API wraps ALL results in this standard structure:

```json
{
  "data": [...],        // Your actual results
  "metadata": {...}     // Query info (total, limit, offset, warnings)
}
```

❌ Wrong: `irm $base/model/projects/`  (missing .data)  
✅ Correct: `(irm $base/model/projects/).data`

### Rule 3: Limit `Select-Object` to 3-5 Fields

❌ Wrong: `$objects | Format-Table` (terminal overflow)  
✅ Correct: `$objects | Select-Object id,status,phase | Format-Table`

### Rule 4: For First Exploration, Use Safe Pattern

```powershell
# Safe first query
(irm "$($session.base)/model/projects/?limit=20").data | 
  Select-Object id,label,maturity | 
  Format-Table

# For full data scan, save to variable first
$all_projects = (irm "$($session.base)/model/projects/").data
Write-Host "Retrieved $($all_projects.Count) projects"
```

---

## What You'll Get

The API returns a JSON object with these sections:

| Section | Description |
|---------|-------------|
| `identity` | Service name, base URLs (local + cloud), APIM headers |
| `golden_rule` | "This HTTP API is the ONLY interface" |
| `discovery_journey` | 5 steps: Health → Layers → Schema → Query → Relationships |
| `bootstrap_sequence` | First 5 calls: health → ready → agent-summary → list → get |
| `query_capabilities` | Universal params (limit, offset, active_only), layer-specific filters |
| `terminal_safety` | How to avoid scrambled PowerShell output (limit=20, Select-Object) |
| `query_patterns` | 20+ examples: filter, navigate, introspect, impact analysis |
| `write_cycle` | 5 rules: capture row_version, strip audit, -Depth 10, no PATCH, copy endpoint id |
| `actor_header` | X-Actor for writes, Authorization for admin |
| `common_mistakes` | 9 lessons learned (includes git CLI quirks, branch protection) |
| `examples` | Before/after code showing safe patterns |
| `layers_available` | All 41 operational layers (services → validation_rules) |
| `layer_notes` | Special cases (endpoints id format, services obj_id, wbs ado_epic_id, etc.) |
| `forbidden` | 7 rules: no model/*.json reads, no grep, no PATCH, etc. |
| `quick_reference` | All endpoints with one-line descriptions |

---

## Copy-Paste Quick Start

**3 working examples to get productive in 60 seconds:**

### Response Structure (IMPORTANT!)

All layer endpoints return data wrapped in a standard structure:

```json
{
  "data": [...],        // Your actual data array
  "metadata": {         // Query information
    "total": 56,
    "limit": null,
    "offset": 0,
    "_query_warnings": []
  }
}
```

**Always access the `.data` property:**

```powershell
# ✅ Correct - access .data property
$projects = (Invoke-RestMethod "$base/model/projects/").data

# ❌ Wrong - missing .data (shows empty table)
$projects = Invoke-RestMethod "$base/model/projects/"
```

---

### Example 1: Get Endpoints for a Service
```powershell
$base = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"
$endpoints = (Invoke-RestMethod "$base/model/endpoints/?service=eva-brain-api&limit=10").data
$endpoints | Select-Object id, method, path, status | Format-Table
```

### Example 2: Count Projects by Maturity
```powershell
$base = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"
$projects = (Invoke-RestMethod "$base/model/projects/").data
$projects | Group-Object maturity | Select-Object Name, Count | Format-Table
```

### Example 3: Discover Layer Schema
```powershell
$base = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"
# Get an example object to see all available fields (NO .data wrapper for /example)
$example = Invoke-RestMethod "$base/model/projects/example"
$example | Format-List

# Count total objects in this layer (HAS .data wrapper)
$all = (Invoke-RestMethod "$base/model/projects/").data
Write-Host "Total projects: $($all.Count)"
```

---

## PowerShell Tip: Counting Nested Objects

When counting properties in nested objects from the API:

**❌ Don't use:**
```powershell
$guide.common_mistakes.PSObject.Properties.Count  # Prints "1 1 1 1 1 1 1 1 1"
```

**✅ Use instead:**
```powershell
($guide.common_mistakes.PSObject.Properties | Measure-Object).Count  # Prints "9"
```

This is a PowerShell display quirk, not an API issue.

---

---

## Integration with Copilot Instructions (Three-Tier Hierarchy)

This guide is ONE of three instruction levels. Here's how they work together:

1. **Workspace Level** → Read `C:\AICOE\.github\copilot-instructions.md`
   - Workspace name, skills, architecture
   - Directs you: "See Project 37 User Guide for API guidance"

2. **API Bootstrap** → YOU ARE HERE
   - Call `GET /model/agent-guide` (this guide's content)
   - Store response in `$session.guide`
   - All query patterns, write rules, safety limits now available

3. **Project Level** → Read `.github/copilot-instructions.md` in project repo
   - Project-specific layer mappings
   - Project owns which entities?
   - Local overrides for `$session` if needed

**Integration Flow:**
```
Workspace context (5 min read)
         ↓
    API Bootstrap (< 1 sec call) ← Step 1: You are here
         ↓
Project-specific rules (README/PLAN/STATUS)
         ↓
   Query/Write using $session.guide patterns
```

---

## API Availability & Reliability (24x7 Production)

MSub API is designed for **24x7 production operation**:
- ✅ Min replicas enabled (always warm, rapid cold start)
- ✅ Cosmos DB backed (geo-replicated, durable)
- ✅ Analytics cache layer (typical response < 200ms)

### Expected Response Times
- Health check (`GET /health`): < 50ms
- Agent guide (`GET /model/agent-guide`): < 200ms (analytics cached)
- Layer query (`GET /model/{layer}/?limit=100`): < 500ms
- Large export (`GET /model/admin/export`): < 5s

### If API Response Is Slow (Retry Pattern)

```powershell
$maxRetries = 3
$retryDelayMs = 50

for ($attempt = 1; $attempt -le $maxRetries; $attempt++) {
    try {
        return (Invoke-RestMethod "$base/model/agent-guide" -TimeoutSec 5)
    } catch {
        if ($attempt -eq $maxRetries) {
            Write-Error "[FAIL] API unavailable after $maxRetries retries."
            Write-Error "Check: https://status.example.com"
            exit 1
        }
        $delay = $retryDelayMs * [Math]::Pow(2, $attempt - 1)
        Write-Warning "[RETRY] Attempt $attempt failed. Waiting ${delay}ms..."
        Start-Sleep -Milliseconds $delay
    }
}
```

### If API Returns Partial Response

Check `metadata._query_warnings` in response:

```powershell
$response = Invoke-RestMethod "$base/model/projects/"
if ($response.metadata._query_warnings) {
    Write-Warning "[WARN] Partial response: $($response.metadata._query_warnings)"
    Write-Host "[INFO] Got $($response.data.Count) of $($response.metadata.total) expected."
    # Safe to proceed; transient backend lag
}
```

### Monitoring & Incidents

- **Status Page**: https://status.example.com
- **Report Issues**: Create issue in https://github.com/eva-foundry/37-data-model
- **Include**: Response time, query used, timestamp, error message
