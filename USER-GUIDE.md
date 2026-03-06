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

## Why This Approach?

The `GET /model/agent-guide` endpoint is the **single source of truth** for agent guidance. This markdown file exists only to tell you WHERE to get the real guide.

**Benefits:**
- ✅ Always up to date (API is updated with code changes)
- ✅ No sync drift between docs and implementation
- ✅ Self-documenting (modify api/server.py to update guidance)
- ✅ Includes live examples with current data counts

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
| `common_mistakes` | 9 lessons learned with error/cause/fix |
| `examples` | Before/after code showing safe patterns |
| `layers_available` | All 41 layers (services → validation_rules) |
| `layer_notes` | Special cases (endpoints id format, services obj_id, wbs ado_epic_id) |
| `forbidden` | 7 rules: no model/*.json reads, no grep, no PATCH, etc. |
| `quick_reference` | All endpoints with one-line descriptions |

---

## Copy-Paste Quick Start

**3 working examples to get productive in 60 seconds:**

### Example 1: Get Endpoints for a Service
```powershell
$base = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"
$endpoints = Invoke-RestMethod "$base/model/endpoints/?service=eva-brain-api&limit=10"
$endpoints | Select-Object id, method, path, status | Format-Table
```

### Example 2: Count Projects by Maturity
```powershell
$base = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"
$projects = Invoke-RestMethod "$base/model/projects/"
$projects | Group-Object maturity | Select-Object Name, Count | Format-Table
```

### Example 3: Discover Layer Schema
```powershell
$base = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"
$fields = Invoke-RestMethod "$base/model/projects/fields"
Write-Host "Available fields: $($fields -join ', ')"
$example = Invoke-RestMethod "$base/model/projects/example"
$example | Format-List
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

## Emergency: If API Is Down

If the API is unreachable, the backup guide is in your conversation history. But **ALWAYS try the API first** - it has the latest guidance including lessons learned from recent sessions.
