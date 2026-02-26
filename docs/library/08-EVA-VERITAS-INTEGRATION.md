# 08-EVA-VERITAS-INTEGRATION.md
# EVA Veritas -- Model Integrity Verification

**Location**: `37-data-model/docs/library/`
**Version**: 1.0.0
**EO-ID**: EO-08-002
**Project**: 48-eva-veritas

---

## Overview

`eva-veritas` is the **Evidence Plane** of the EVA architecture. It computes the gap between
*declared* project progress (docs: README/PLAN/STATUS/ACCEPTANCE) and *actual* project progress
(artifacts in the filesystem: source files, evidence receipts, test output).

The data model API now exposes this capability via `POST /model/admin/audit-repo`, allowing any
agent to verify that a project's declared state is substantiated by real work.

---

## When to Call audit-repo

Call `POST /model/admin/audit-repo` before:

1. **Committing large model changes** -- verify the target project has real artifacts backing the
   endpoints/screens you are registering
2. **Sprint seeding** -- identify gap stories to convert to PBIs (use `generate_ado_items` with
   `include_gaps: true`)
3. **Release gates** -- trust_score >= 70 required before `merge-with-approval`; >= 90 for `deploy`

---

## How to Call

### Direct API call

```powershell
$body = '{"project_id":"33-eva-brain-v2"}'
Invoke-RestMethod "http://localhost:8010/model/admin/audit-repo" `
    -Method POST -ContentType "application/json" -Body $body `
    -Headers @{"Authorization"="Bearer dev-admin"}
```

### With explicit path

```powershell
$body = '{"repo_path":"C:\\AICOE\\eva-foundation\\33-eva-brain-v2"}'
Invoke-RestMethod "http://localhost:8010/model/admin/audit-repo" `
    -Method POST -ContentType "application/json" -Body $body `
    -Headers @{"Authorization"="Bearer dev-admin"}
```

### Response shape

```json
{
  "project_id":  "33-eva-brain-v2",
  "repo_path":   "C:\\AICOE\\eva-foundation\\33-eva-brain-v2",
  "trust_score": 82,
  "coverage": {
    "stories_total":          24,
    "stories_with_artifacts": 18,
    "stories_with_evidence":  15,
    "consistency_score":      0.9
  },
  "gaps": [
    { "type": "missing_implementation", "story_id": "F33-004", "title": "JWT refresh logic" },
    { "type": "missing_evidence",       "story_id": "F33-007", "title": "Rate limiter tests" }
  ],
  "actions": ["review-required"]
}
```

---

## Interpreting the Trust Score (MTI)

| Score range | Actions allowed                         | What it means |
|-------------|-----------------------------------------|---------------|
| 90-100      | deploy, merge, release                  | Fully proven  |
| 70-89       | test, review, merge-with-approval       | Good evidence |
| 50-69       | review-required, no-deploy              | Gaps exist    |
| 0-49        | block, investigate                      | Unverified    |

MTI formula: `(Coverage * 0.4) + (Evidence * 0.4) + (Consistency * 0.2)`

---

## Gap Types

| Gap type              | Meaning                                                     | Fix |
|-----------------------|-------------------------------------------------------------|-----|
| `missing_implementation` | Story declared in PLAN.md has no tagged source artifact  | Tag a source file: `// EVA-STORY: <ID>` |
| `missing_evidence`    | Story has code but no evidence receipt (`.txt` or `.json`) | Add `evidence/EO-XX-<name>.txt` with story tag |
| `orphan_story_tag`    | A file is tagged for a story not declared in PLAN.md       | Add the story to PLAN.md or remove the tag |

---

## Prerequisites

The endpoint proxies to the **eva-veritas MCP server** (EO-07).

Start it before calling the endpoint:

```bash
cd C:\AICOE\eva-foundation\48-eva-veritas
node src/mcp-server.js --port 8031
```

Or set `EVA_VERITAS_MCP_URL` to point at a remote instance:

```powershell
$env:EVA_VERITAS_MCP_URL = "http://remote-host:8031"
```

The API returns HTTP 503 with a clear message if the MCP server is unreachable.

---

## Configuration

| Variable                | Default                       | Description |
|-------------------------|-------------------------------|-------------|
| `EVA_VERITAS_MCP_URL`   | `http://localhost:8031`       | eva-veritas MCP server base URL |
| Portfolio root          | `37-data-model/../../../`     | Auto-resolved from file location; projects live as `{root}/{project_id}/` |

---

## Commit Gate Pattern

```powershell
# 1. Audit the target project
$audit = Invoke-RestMethod "http://localhost:8010/model/admin/audit-repo" `
    -Method POST -ContentType "application/json" `
    -Body '{"project_id":"33-eva-brain-v2"}' `
    -Headers @{"Authorization"="Bearer dev-admin"}

# 2. Gate on trust score
if ($audit.trust_score -lt 70) {
    Write-Warning "[FAIL] MTI=$($audit.trust_score) -- gap count=$($audit.gaps.Count). Fix gaps before committing."
    $audit.gaps | Select-Object type, story_id, title | Format-Table
    exit 1
}

# 3. Proceed with model commit
Invoke-RestMethod "http://localhost:8010/model/admin/commit" `
    -Method POST -Headers @{"Authorization"="Bearer dev-admin"}
```

---

## Related

- `48-eva-veritas` -- source of truth for the MCP server and CLI
- `EO-09` -- 38-ado-poc integration: auto-seeding sprint PBIs from gap stories
- `EO-10` -- 29-foundry registration: MCP server in the agentic hub
- `GET /model/admin/validate` -- cross-reference integrity check (complements veritas)
