# Evidence Layer — Generally Available (GA)

**Date:** March 1, 2026 7:39 PM ET  
**Service:** Evidence Layer (L31 — Observability Plane)  
**Endpoints:** ACA 24x7 at `https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io/model/evidence/`

---

## Quick Start

### Record Evidence (Python)

```python
from evidence_generator import EvidenceBuilder

evidence = (
    EvidenceBuilder(sprint_id="51-ACA-sprint-1", story_id="51-ACA-001", phase="D3")
    .add_validation(test_result="PASS", lint_result="PASS", coverage_percent=92)
    .add_metrics(duration_ms=3600000, files_changed=14, lines_added=582)
    .add_artifact(path="src/extractor.py", action="modified")
    .build()
)

# Push to data model
import requests
requests.put(
    f"https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io/model/evidence/{evidence['id']}",
    json=evidence,
    headers={"X-Actor": "agent:51-agentic-engine"}
)
```

### Record Evidence (PowerShell)

```powershell
$evidence = @{
    id = "51-ACA-sprint-1-do-51-ACA-001"
    sprint_id = "51-ACA-sprint-1"
    story_id = "51-ACA-001"
    phase = "D3"
    validation = @{test_result = "PASS"; lint_result = "PASS"; coverage_percent = 92}
    metrics = @{duration_ms = 3600000; files_changed = 14; lines_added = 582}
    artifacts = @(@{path = "src/extractor.py"; action = "modified"})
} | ConvertTo-Json -Depth 10

Invoke-RestMethod `
    -Uri "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io/model/evidence/51-ACA-sprint-1-do-51-ACA-001" `
    -Method PUT `
    -ContentType "application/json" `
    -Body $evidence
```

### Query Evidence

```powershell
# All evidence for a sprint
Invoke-RestMethod `
    "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io/model/evidence/?sprint_id=51-ACA-sprint-1" | 
    Select-Object id, phase, @{N="test";E={$_.validation.test_result}}

# Query tool (CLI)
pwsh -File scripts/evidence_query.py --sprint 51-ACA-sprint-1 --format table
```

---

## Merge Gates

**CI/CD automatically blocks merge if:**
- `test_result = "FAIL"`
- `lint_result = "FAIL"`

**Script:** `scripts/evidence_validate.ps1` (runs on every PR)

---

## Schema Fields

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `id` | string | YES | Unique record ID (format: `{sprint}-{phase}-{story_id}`) |
| `sprint_id` | string | YES | Which sprint (e.g. `51-ACA-sprint-1`) |
| `story_id` | string | YES | Which story (e.g. `51-ACA-001`) |
| `phase` | enum | YES | DPDCA phase: `D1`, `D2`, `P`, `D3`, `A` |
| `validation.test_result` | enum | YES | `PASS` \| `FAIL` \| `WARN` \| `SKIP` |
| `validation.lint_result` | enum | YES | `PASS` \| `FAIL` \| `WARN` \| `SKIP` |
| `validation.coverage_percent` | float | NO | Percent 0-100 |
| `metrics.duration_ms` | int | NO | Milliseconds |
| `metrics.files_changed` | int | NO | File count |
| `metrics.lines_added` | int | NO | Lines added |
| `metrics.tokens_used` | int | NO | LM tokens |
| `metrics.cost_usd` | float | NO | Cost in USD |
| `artifacts` | array | NO | `[{path, type, action}]` |
| `commits` | array | NO | `[{sha, message, timestamp}]` |

---

## Full Documentation

- **Usage Guide:** [USER-GUIDE.md](USER-GUIDE.md#evidence-layer--proof-of-completion)
- **Architecture:** [ARCHITECTURE.md](ARCHITECTURE.md#observability-layers-l11)
- **Library:** `.github/scripts/evidence_generator.py`
- **Query Tool:** `scripts/evidence_query.py`
- **Validator:** `scripts/evidence_validate.ps1`

**Date:** February 20, 2026 — 5:01 AM ET  
**From:** AI Centre of Excellence  
**To:** EVA Project Stakeholders, EVA Development Teams, AI Engineering Leads  
**Subject:** `37-data-model` reaches 11/11 layers — model is now authoritative

---

## What Just Happened

At 5:01 AM ET on February 20, 2026, the EVA Data Model completed its final
layer population and passed all validation checks.

```
Layers populated : 11 / 11   ✅
validate-model   : PASS — 0 violations   ✅  
Total objects    : 570+   ✅
```

**The model is now the authoritative machine-queryable source of truth for
the entire EVA ecosystem.** Any agent, developer or automated pipeline can
answer structural questions about EVA without reading a single source file.

---

## What the Model Contains

| Layer | Objects | What it answers |
|-------|---------|-----------------|
| L0 Services | 9 | What services exist, their ports, health endpoints |
| L1 Personas | 6 | Who can act — admin, researcher, clerk, auditor, support, machine-agent |
| L2 Feature Flags | 9 | Which feature each persona can access |
| L3 Containers | 7 | Every Cosmos DB container, its fields, partition key, TTL |
| L4 Endpoints | 44 | Every HTTP endpoint — auth, feature flag, request/response, Cosmos reads/writes |
| L5 Schemas | 36 | Every Pydantic request/response shape |
| L6 Screens | 6 | Every React admin and chat screen, its route and API calls |
| L7 Literals | 112 | Every displayed string key with EN + FR defaults |
| L8 Agents | 3 | Every agent-fleet agent, its skill file, input/output types |
| L9 Infrastructure | 23 | Every Azure resource: OpenAI, Search, Cosmos, Storage, APIM, Key Vault |
| L10 Requirements | 22 | Epics, requirements, stories and acceptance criteria traced to endpoints |

---

## What This Enables Today

### For AI agents / GitHub Copilot
Load `eva-model.json` once per session. Answer any of these questions in 3 lines
of PowerShell — no grep, no file traversal:

- "What endpoints does an admin persona have access to?"
- "If I rename the `key` field in the translations container, what breaks?"
- "Which screens call `POST /v1/chat` and what literals do they display?"
- "Which requirements have zero test coverage?"
- "What Key Vault secrets does the brain-api need at startup?"

### For developers
Before opening any route file, open a PowerShell terminal and query the model.
If the answer is there, do not read source. The model saves an estimated 8–12
prompts of context per agent session.

### For project managers
Requirements are now cross-referenced to endpoints and screens. Coverage gaps
are visible with a single query:

```powershell
$m = Get-Content model/eva-model.json | ConvertFrom-Json
$m.requirements | Where-Object { $_.test_ids.Count -eq 0 } | Select-Object id, title, status
```

### For QA / test engineers
Every endpoint is tagged with its `status` (implemented / stub / planned).
The acceptance-criterion objects in requirements.json name the exact screen
and endpoint they cover.

---

## Accuracy Boundaries

The model was populated from source files as they existed between
February 19–20, 2026.  Accuracy boundaries to be aware of:

| Item | Accuracy | Notes |
|------|----------|-------|
| Endpoints (implemented) | High | Read directly from route files |
| Endpoints (stub/planned) | Medium | Inferred from code comments + PLAN.md |
| Cosmos container fields | High | Read from cosmos_service.py and sessions.py |
| Literals | High | Extracted from useTranslations.ts + MockBackendService.ts |
| Infrastructure resource names | Medium | Read from .env; some names are placeholders |
| Requirements | Medium | Derived from PLAN.md; not from a formal requirements tracker |

**Known open issues tracked at REQ-001 through REQ-010 in `model/requirements.json`.**

---

## How to Use It

See [USER-GUIDE.md](USER-GUIDE.md) for a full walkthrough with copy-paste examples.

---

## Maintenance Commitment

The model is only valuable if it stays current.  The rules are enforced by
[`.github/copilot-instructions.md`](.github/copilot-instructions.md):

- Every source PR must include a model update in the same commit
- `validate-model.ps1` must exit 0 before merge
- `scripts/sync-from-source.ps1` is run at every sprint close

---

## Contacts

| Role | Owner |
|------|-------|
| Model custodian | AI CoE |
| EVA Brain API | 33-eva-brain-v2 team |
| EVA Faces | 31-eva-faces team |
| APIM / Infrastructure | 17-apim team |

---

## Team Briefings

### 33-eva-brain-v2

**What the model already knows about you**

- All 44 of your endpoints are catalogued with method, path, auth, feature_flag,
  `cosmos_reads`, `cosmos_writes`, and status (19 implemented · 22 stub · 3 planned)
- All 7 Cosmos containers with field definitions, partition keys, and TTL
- All 36 request/response schemas extracted from your Pydantic models
- All 9 feature flags mapped to your `FeatureID` enum and persona access lists
- Your full Azure dependency inventory — OpenAI deployment, AI Search index,
  Cosmos account/DB, Storage account, Container App, Entra App Registration

**What you must do from today**

1. **Every new endpoint** → add to `model/endpoints.json` in the same PR.
   Use the existing 44 as templates. Status starts as `stub`; change to `implemented`
   when the route handler is complete and tested.

2. **Prefix verification** — open issue REQ-001.
   Confirm the `/v1/*` prefix is correct for sessions/search/config/ingest/admin
   against `app/main.py`. If a prefix is wrong, update the endpoint `id` in
   `endpoints.json` and re-run the assembler.

3. **Mount tags.py** — open issue REQ-002.
   Three tag endpoints are `status: planned` because `tags.py` is not mounted
   in `main.py`. When you mount it, change the three records to `stub`.

4. **When a resource is provisioned** → change `status` from `planned` to
   `provisioned` in `model/infrastructure.json`.

**Your most useful queries**

```powershell
$m = Get-Content C:\eva-foundry\eva-foundation\37-data-model\model\eva-model.json | ConvertFrom-Json

# All stub endpoints — what is still to implement this sprint?
$m.endpoints | Where-Object { $_.status -eq 'stub' } | Select-Object id | Sort-Object id

# What writes to the jobs container? (blast radius before changing its schema)
$m.endpoints | Where-Object { $_.cosmos_writes -contains 'jobs' } | Select-Object id, status

# Which personas can reach a given endpoint?
($m.endpoints | Where-Object { $_.id -eq 'POST /v1/chat' }).auth

# What env vars does the brain-api container app need at startup?
$m.infrastructure | Where-Object { $_.service -eq 'eva-brain-api' -and $_.env_var } |
  Select-Object env_var, azure_resource_name | Sort-Object env_var
```

---

### 31-eva-faces

**What the model already knows about you**

- All 6 screens modelled: TranslationsPage (implemented), SettingsPage,
  AppsPage (stub), AuditLogsPage, RbacPage (stub), ChatPane (poc)
- 112 literal keys extracted from `useTranslations.ts` and `MockBackendService.ts`,
  with EN defaults — all mapped to the screen they appear in
- 3 agent-fleet agents: screen-generator, test-generator, validator — with
  skill file paths and input/output types
- Phase 2 and Phase 3 requirements traced to screens (EPIC-003, EPIC-004)

**What you must do from today**

1. **When a screen moves from stub → implemented** → update `status` in
   `model/screens.json`. This is the signal test engineers use to know
   Playwright can target that screen.

2. **Every new string key** in any i18n file or `useTranslations.ts` call →
   add to `model/literals.json` in the same PR with `default_en`, `default_fr`,
   and the `screens` array referencing the screen id.

3. **SettingsPage / AppsPage real wiring** (REQ-005) — when MockBackendService
   calls are replaced with real API calls, update the `api_calls` array on
   those screen records in `screens.json`. Open issue: `GET /v1/config/info`
   and `GET /v1/config/features` are the expected targets.

4. **When a new agent is added** to `agent-fleet/app/agents/` → add to
   `model/agents.json` with `input_type`, `output_type`, `llm_deployment`,
   and the skill file path.

**Open gaps the model has flagged for your backlog**

| Issue | Impact |
|-------|--------|
| AuditLogsPage and RbacPage are `stub` | Any agent asked "is this screen implemented?" answers correctly |
| SettingsPage and AppsPage still show `MockBackendService` | api_calls contains planned endpoints; wire-up REQ-005 |
| ChatPane is `poc` | Three chat literals exist; more will accumulate in Phase 3 |
| 0 French translations in current literals | REQ-010 WCAG/l10n — all 112 literals need `default_fr` |

**Your most useful queries**

```powershell
$m = Get-Content C:\eva-foundry\eva-foundation\37-data-model\model\eva-model.json | ConvertFrom-Json

# Which screens are not yet implemented?
$m.screens | Where-Object { $_.status -ne 'implemented' } | Select-Object id, status, app

# All literals missing a French translation (hand to translator)
$m.literals | Where-Object { -not $_.default_fr } | Select-Object key, default_en | Sort-Object key

# What endpoints does SettingsPage need wired?
($m.screens | Where-Object { $_.id -eq 'SettingsPage' }).api_calls

# Which requirements are assigned to your screens?
$m.requirements | Where-Object { $_.satisfied_by | ForEach-Object { $_ -in $m.screens.id } |
  Where-Object { $_ } } | Select-Object id, title, status
```

---

### 29-foundry

**What the model already knows about you**

- Registered as service `foundry` in `model/services.json` — type: `azure_ai_foundry`,
  status: `active`
- Two OpenAI deployments catalogued in infrastructure:
  - `openai-brain-deployment` — `marco-sandbox-openai-v2` / `gpt-5.1-chat` (used by eva-brain-api)
  - `openai-agent-deployment` — `esdaicoe-ai-foundry-openai` / `gpt-5.1-chat` (used by agent-fleet)
- Three agent-fleet agents reference your deployment via `llm_deployment`
- App Insights resource (`eva-appinsights`) registered as `planned` pending
  the APPINSIGHTS_CONNECTION_STRING being filled in the brain-api `.env`

**What you must do from today**

1. **When a new model deployment is created or a deployment name changes** →
   update `azure_resource_name` and `notes` on the corresponding infrastructure
   record in `model/infrastructure.json`. Also update `llm_deployment` in
   `model/agents.json` for any agent that uses it.

2. **When App Insights is wired** → change `appinsights` infrastructure record
   from `status: planned` to `status: provisioned` and fill in the real
   `azure_resource_name`.

3. **Foundry project expansions** — if new cognitive services are added
   (Translator, Computer Vision, Text Analytics are currently `planned`) →
   confirm Azure resource names and update the corresponding infrastructure
   records from placeholder names to real names, and flip `status: provisioned`.

4. **Model version changes** — if `gpt-5.1-chat` is retired or a new deployment
   is promoted → update `notes` on both `openai_deployment` records and
   update `llm_deployment` on all three agent records.

**Your most useful queries**

```powershell
$m = Get-Content C:\eva-foundry\eva-foundation\37-data-model\model\eva-model.json | ConvertFrom-Json

# Which services depend on your OpenAI deployments?
$m.infrastructure | Where-Object { $_.type -eq 'openai_deployment' } |
  Select-Object id, azure_resource_name, service

# Which agents use which LLM deployment?
$m.agents | Select-Object id, llm_deployment, status

# All infrastructure resources still in 'planned' state (your provisioning backlog)
$m.infrastructure | Where-Object { $_.status -eq 'planned' } |
  Select-Object id, type, azure_resource_name | Sort-Object type

# What Key Vault secrets need to be set before brain-api starts cleanly?
$m.infrastructure | Where-Object { $_.keyvault_secret_name } |
  Select-Object keyvault_secret_name, env_var, status | Sort-Object status
```

---

*This announcement was generated at model completion: 2026-02-20T05:01:00-05:00*
