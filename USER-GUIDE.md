# EVA Data Model - Agent User Guide

**Version:** 3.3  
**Last Updated:** March 7, 2026 6:03 PM ET (Session 38 - Paperless Governance)  
**Audience:** AI agents (GitHub Copilot, Claude, custom skills)

---

## 🎯 **PAPERLESS GOVERNANCE** (Session 38, March 7, 2026 6:03 PM ET)

**Mandatory files on disk:**
- ✅ `README.md` - Project overview, architecture, integration points
- ✅ `ACCEPTANCE.md` - Quality gates, exit criteria, evidence requirements

**Everything else flows through data model API:**
- ❌ ~~STATUS.md~~ → `GET /model/project_work/{project_id}` (Layer 34)
- ❌ ~~PLAN.md~~ → `GET /model/wbs/?project_id={id}` (Layer 26)
- ❌ ~~Sprint tracking~~ → `GET /model/sprints/?project_id={id}` (Layer 27)
- ❌ ~~Risk register~~ → `GET /model/risks/?project_id={id}` (Layer 29)
- ❌ ~~ADRs~~ → `GET /model/decisions/?project_id={id}` (Layer 30)
- ❌ ~~Evidence~~ → `GET /model/evidence/?project_id={id}` (Layer 31)

**Agent workflow (paper-free):**
1. Bootstrap → `GET /model/agent-guide` (get complete protocol)
2. Project context → `GET /model/projects/{id}` (governance metadata)
3. Current work → `GET /model/project_work/{id}-{date}` (active session)
4. Sprint progress → `GET /model/sprints/?project_id={id}` (velocity, burndown)
5. Evidence → `GET /model/evidence/?sprint_id={current}` (DPDCA phases)

**When work is done:**
- Update work log: `PUT /model/project_work/{id}` with deliverables, metrics
- Add evidence: `PUT /model/evidence/{sprint}-{story}-{phase}` with artifacts
- Update WBS: `PUT /model/wbs/{story_id}` with status=complete

**No markdown files to maintain** → Single source of truth, always current, queryable by any agent.

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
- Write cycle (PUT with ID in URL, X-Actor header, commit workflow)
- Authentication (X-Actor for writes, NO tokens required)
- Common mistakes (13+ lessons learned with fixes)
- Forbidden actions (what NOT to do)
- Quick reference (all endpoints)
- **Layer introspection** (query live counts, don't hardcode)

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
- ✅ Live layer discovery via introspection (no hardcoded counts)

---

## 🚨 CRITICAL: Authentication & Write Patterns (Session 38 Lessons)

### Authentication: X-Actor Header (NOT Tokens)

**❌ Wrong Assumption**: "I need FOUNDRY_TOKEN or credentials to write"  
**✅ Reality**: Write operations only need simple X-Actor header

```powershell
# Write operations - what you ACTUALLY need
$Headers = @{
  "X-Actor" = "agent:copilot"
  "Content-Type" = "application/json"
}

# NO FOUNDRY_TOKEN, NO GH_TOKEN, NO CREDENTIALS NEEDED
Invoke-RestMethod -Uri "$base/model/project_work/my-id" -Method PUT -Headers $Headers -Body $json
```

**Key Rule**: Check `$session.guide.actor_header` before assuming authentication requirements.

---

### Write Pattern: PUT with ID in URL (NOT POST)

**❌ Wrong Assumption**: "I'll POST to /model/project_work/ to create an object"  
**✅ Reality**: This API uses PUT with explicit ID in URL path

```powershell
# ❌ This returns 405 Method Not Allowed
POST /model/project_work/ -Body $json

# ✅ Correct: PUT with ID in URL
PUT /model/project_work/07-foundation-layer-2026-03-07 -Body $json -Headers @{'X-Actor'='agent:copilot'}
```

**Key Rules** (from `$session.guide.write_cycle`):
1. **No POST support**: All writes use PUT
2. **ID in URL path**: `/model/{layer}/{id}`
3. **Creates or updates**: If ID doesn't exist → creates (row_version=1); if exists → updates (row_version++)
4. **Full object required**: No PATCH support, always PUT complete object

---

### Layer Discovery: Use Introspection (NOT Hardcoded Assumptions)

**❌ Wrong Assumption**: "Features are stored in /features/ endpoint"  
**✅ Reality**: Use introspection to discover available layers

```powershell
# Discover all available layers (live count)
$layers = Invoke-RestMethod "$base/model/agent-summary"
$layers.PSObject.Properties | ForEach-Object { Write-Host "$($_.Name): $($_.Value) objects" }

# Check if a specific layer exists
$guide = Invoke-RestMethod "$base/model/agent-guide"
if ($guide.layers_available -contains "project_work") {
  Write-Host "✅ project_work layer exists"
}

# See example object schema
$example = Invoke-RestMethod "$base/model/project_work/example"
$example | Format-List  # Shows actual fields available
```

**Key Rules**:
1. **Never hardcode layer names** without checking `$session.guide.layers_available`
2. **Never hardcode field names** without querying `/model/{layer}/example`
3. **Never hardcode layer counts** (evolves frequently - use live introspection)
4. Work tracking uses `project_work` layer (not `/features/` or `/stories/`)

---

### Putting It All Together: Complete Write Pattern

```powershell
# 1. Bootstrap session (once at start)
$session = @{
    base = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"
    guide = (Invoke-RestMethod "$base/model/agent-guide" -TimeoutSec 10)
}

# 2. Discover available layers
if ($session.guide.layers_available -contains "project_work") {
    
    # 3. Inspect schema
    $example = Invoke-RestMethod "$($session.base)/model/project_work/example"
    Write-Host "Available fields: $($example.PSObject.Properties.Name -join ', ')"
    
    # 4. Build payload (match schema structure)
    $Body = @{
        id = "my-project-2026-03-07"
        project_id = "my-project"
        session_summary = @{ session_number = 1; date = "2026-03-07"; status = "Complete" }
        tasks = @()
        is_active = $true
    } | ConvertTo-Json -Depth 10
    
    # 5. Write with X-Actor header (NO TOKENS)
    $Headers = @{ "X-Actor" = "agent:copilot"; "Content-Type" = "application/json" }
    $Response = Invoke-RestMethod `
        -Uri "$($session.base)/model/project_work/my-project-2026-03-07" `
        -Method PUT `
        -Headers $Headers `
        -Body $Body
    
    Write-Host "✅ Created: row_version=$($Response.row_version), created_by=$($Response.created_by)"
}
```

**This Pattern Saves Hours**: Session 38 wasted time assuming FOUNDRY_TOKEN + POST patterns. Check the guide first!

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
| `write_cycle` | PUT with ID in URL (not POST), X-Actor header, 5 rules, commit workflow |
| `actor_header` | X-Actor for writes (no tokens needed), Authorization for admin |
| `common_mistakes` | 13+ lessons learned (auth, POST vs PUT, introspection, git quirks) |
| `examples` | Before/after code showing safe patterns |
| `layers_available` | All operational layers (query live - count evolves, don't hardcode) |
| `layer_notes` | Special cases (endpoints id format, project_work tracking, etc.) |
| `forbidden` | 7 rules: no model/*.json reads, no grep, no PATCH, no POST, etc. |
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
$guide.common_mistakes.PSObject.Properties.Count  # Prints "1 1 1 1..." (wrong)
```

**✅ Use instead:**
```powershell
($guide.common_mistakes.PSObject.Properties | Measure-Object).Count  # Prints actual count (13+ as of Session 38)
```

This is a PowerShell display quirk, not an API issue. Count evolves as lessons are learned.

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
