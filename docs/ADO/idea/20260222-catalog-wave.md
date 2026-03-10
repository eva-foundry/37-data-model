# EVA Data Model — Catalog Wave + Precedence Fields

**Component:** 37-data-model  
**Epic type:** Enhancement — Model Completeness  
**Created:** 2026-02-22  
**Status:** Idea — not yet onboarded to ADO  
**Source:** `33-eva-brain-v2/docs/ADO/20260222-to-be-cataloged.md` (full eva-foundation scan)  
**Depends on:** Epic 164 (Maintenance & Extension), `20260222-enhancement.md` (Audit Trail)

---

## Context

Eva-brain-v2 scanned all 22 numbered project folders under `C:\eva-foundry\eva-foundation`
and cataloged every object that belongs in the data model but is not yet there.

Two categories of gap were identified:

1. **Precedence fields** — The model has `depends_on` on services (runtime) but no
   ordering signals for boot sequence, deploy pipeline, persona role hierarchy,
   feature flag priority, or requirement prerequisite chains.

2. **Catalog gaps** — 12+ missing services, 3 missing layers, 9+ missing screens,
   5+ missing connections, and entire object classes (MCP servers, Prompty templates,
   security controls, CLI tools) not yet represented.

---

## Gap Analysis

### 1. Precedence — What's Missing

| Layer | Current state | Missing field | Consequence of absence |
|---|---|---|---|
| `services` | `depends_on: [svc_id]` (runtime only) | `boot_order: int` | No authoritative startup sequence for local dev / `docker-compose` |
| `services` | `depends_on` only | `deploy_order: int` | CI/CD pipeline stage order must be inferred by reading the graph |
| `infrastructure` | No ordering | `provision_order: int` | Bicep/Terraform module order undefined — manual knowledge required |
| `feature_flags` | `personas: [id]` flat | `priority: int` | If two flags apply to one request, evaluation order is undefined |
| `personas` | Flat list, no hierarchy | `rank: int`, `supersedes: [persona_id]` | `admin` vs `machine-agent` conflict undefined; tooling cannot reason about role elevation |
| `requirements` | `satisfied_by: []` | `depends_on: [req_id]` | Requirement prerequisite chains invisible — sprint ordering relies on human memory |
| `endpoints` | `auth: [persona_id]` (OR semantics implied) | `auth_mode: "any" \| "all"` | Cannot express "requires admin AND auditor approval" |
| `cp_agents` | `plane`, `skills` | `execution_order: int` (within a workflow) | Multi-agent execution order within a workflow not modeled; `cp_workflows` fills some of this but not at agent level |

**Key insight:** `depends_on` on services covers *runtime* topology.
The model needs three additional precedence axes:
- **Build-time** — `build_order` (which repo/container builds first in CI)
- **Deploy-time** — `deploy_order` / `provision_order` (infra → platform → service → frontend)
- **Evaluation-time** — `priority` / `rank` / `auth_mode` (flag conflicts, persona hierarchy, auth logic)

### 2. Missing Services (12 new entries for `services` layer)

| id | type | port | source folder | status |
|---|---|---|---|---|
| `eva-foundry-lib` | python_library | — | 29-foundry | implemented |
| `eva-red-teaming` | eval_harness | — | 36-red-teaming | implemented (MVP) |
| `eva-cli` | cli_tool | — | 41-eva-cli | implemented (v0.1.0) |
| `eva-control-plane` | fastapi_backend | TBD | 40-eva-control-plane | partial |
| `eva-cdc` | stub | — | 15-cdc | planned |
| `eva-devbench` | react_spa | TBD | 40-eva-devbench | partial |
| `eva-jp-spark` | react_spa | — | 44-eva-jp-spark | partial |
| `eva-ado-dashboard` | npm_package | — | 39-ado-dashboard | partial |
| `eva-ado-command-center` | orchestration | — | 38-ado-poc | implemented |
| `az-finops-pipeline` | data_pipeline | — | 14-az-finops | planned |
| `eva-ui-bench` | test_harness | — | 30-ui-bench | implemented |
| `eva-ai-governance` | automation | — | 19-ai-gov | in-progress |

### 3. Missing Layers (3 new top-level layers)

| Proposed layer | Objects | Source | Notes |
|---|---|---|---|
| `mcp_servers` | 3 (azure-ai-search, cosmos-db, blob-storage) | 29-foundry/mcp-servers/ | MCP protocol — distinct from `agents` |
| `prompts` | 5 Prompty templates | 29-foundry/prompts/ | Versioned prompt assets cross-referenced to endpoints |
| `security_controls` | ITSG-33 controls, OWASP LLM Top 10, MITRE ATLAS categories | 36-red-teaming | ATO evidence backbone; links to requirements + endpoints |

### 4. Missing Screens (9 new entries for `screens` layer)

| id | face | source | status |
|---|---|---|---|
| `screen-jp-chat` | eva-jp-spark | 44-eva-jp-spark | stub |
| `screen-jp-tda` | eva-jp-spark | 44-eva-jp-spark | stub |
| `screen-jp-content` | eva-jp-spark | 44-eva-jp-spark | stub |
| `screen-jp-tutor` | eva-jp-spark | 44-eva-jp-spark | stub |
| `screen-jp-translator` | eva-jp-spark | 44-eva-jp-spark | stub |
| `screen-jp-url-scraper` | eva-jp-spark | 44-eva-jp-spark | stub |
| `screen-eva-home` | ado-dashboard | 39-ado-dashboard | partial |
| `screen-sprint-board` | ado-dashboard | 39-ado-dashboard | partial |
| `screen-devbench-home` | eva-devbench | 40-eva-devbench | partial |

### 5. Missing Connections (5 new entries for `connections` layer)

| id | type | source |
|---|---|---|
| `connection-apim` | apim_gateway | 17-apim — proxies brain-api + roles-api |
| `connection-ado-model-bridge` | ado_webhook | 38-ado-poc — syncs ADO work items → model |
| `connection-cli-ado` | ado_api | 41-eva-cli — ADO adapter |
| `connection-cli-github` | github_api | 41-eva-cli — GitHub adapter |
| `connection-cli-azure` | azure_mgmt | 41-eva-cli — Azure adapter (stub) |

---

## Epic

**Title:** EVA Data Model — Catalog Wave & Precedence Fields  
**Goal:** The data model accurately reflects every live service and object in the
EVA ecosystem, and every layer carries the precedence fields required for automated
boot sequencing, CI/CD pipeline ordering, persona role hierarchy, and feature flag
conflict resolution.

---

## Features

| ID | Title | Summary |
|----|-------|---------|
| dm-cat-f1 | Precedence Fields — Core Layers | Add `boot_order`, `deploy_order`, `rank`, `priority`, `auth_mode`, `depends_on` to services / personas / feature_flags / requirements |
| dm-cat-f2 | Infrastructure Provision Order | Add `provision_order: int` to infrastructure layer; document the canonical Bicep/Terraform stage order |
| dm-cat-f3 | Services Catalog Wave | Add 12 missing services to `services` layer |
| dm-cat-f4 | New Layers: mcp_servers + prompts | Create `mcp_servers.json` and `prompts.json` with schemas, seed data, and validate-model cross-refs |
| dm-cat-f5 | New Layer: security_controls | Create `security_controls.json` — ITSG-33 / OWASP LLM / ATLAS entries linked to requirements and endpoints |
| dm-cat-f6 | Screens + Connections Wave | Add 9 missing screens and 5 missing connections |
| dm-cat-f7 | Infrastructure Accuracy & Completeness | Fix 5 accuracy bugs (cosmos DB name, SWA types, storage account name); add 5 missing entries (ACR, ACA env, Function App, 2 blob containers); backfill real resource values in connections.json |
| dm-cat-f8 | CI/CD Pipeline Entries | Catalog existing GH Actions/ADO pipeline files against services; surface missing brain-v2 CI/CD as tracked gap |
| dm-cat-f9 | Schema Completeness | Add AI Search index field mapping layer; add 8 missing WI-5/WI-6 request/response schemas |

---

## User Stories

### Feature dm-cat-f1 — Precedence Fields: Core Layers

---

**DM-CAT-WI-01 — boot_order + deploy_order on services**  
*Points: 1*

**As a** developer running `docker-compose up` or a CI/CD pipeline author,  
**I want** each service to carry a `boot_order: int` and `deploy_order: int`,  
**so that** the startup sequence and deployment stage order are data-driven,
not tribal knowledge.

**Acceptance criteria:**
- Every entry in `services.json` gains:
  - `boot_order: int` — local startup sequence (1 = first; ties allowed)
  - `deploy_order: int` — CI/CD pipeline stage (1 = infrastructure, 2 = platform services, 3 = backend, 4 = frontend)
- Canonical order (informative):
  ```
  boot_order 1:  eva-roles-api
  boot_order 2:  eva-brain-api (depends on roles)
  boot_order 3:  admin-face, chat-face (depend on brain)
  boot_order 4:  eva-data-model (no runtime deps)
  boot_order 5+: eva-control-plane, eva-cli, eva-devbench, eva-jp-spark
  ```
- `validate-model.ps1` exits 0; no new violations

---

**DM-CAT-WI-02 — rank + supersedes on personas**  
*Points: 1*

**As a** roles-api author or Copilot agent,  
**I want** each persona to carry a `rank: int` and optional `supersedes: [persona_id]`,  
**so that** the system can resolve conflicts when an actor qualifies for multiple personas,
and agents can reason about role elevation without reading `personas.yml` in brain-v2.

**Acceptance criteria:**
- Every entry in `personas.json` gains:
  - `rank: int` — higher = more privileged (admin: 100, machine-agent: 80, auditor: 60, legal-researcher: 40, legal-clerk: 20, support: 10)
  - `supersedes: [persona_id]` — personas this role overrides when both apply (admin supersedes all; machine-agent supersedes researcher/clerk)
- `validate-model.ps1`: `supersedes` entries must reference valid persona ids

---

**DM-CAT-WI-03 — priority + auth_mode on feature_flags and endpoints**  
*Points: 1*

**As a** developer implementing the `@require_feature` guard,  
**I want** feature flags to carry a `priority: int` and endpoints to carry
`auth_mode: "any" | "all"`,  
**so that** flag evaluation order is deterministic and AND-auth semantics can be
expressed without code changes.

**Acceptance criteria:**
- `feature_flags.json`: each entry gains `priority: int` (higher evaluated first; default 50)
- `endpoints.json`: each entry gains `auth_mode: "any" | "all"` (default `"any"` — preserves existing OR semantics)
- Entries currently requiring `"all"` semantics (if any) are identified in notes
- `validate-model.ps1` exits 0

---

**DM-CAT-WI-04 — depends_on on requirements**  
*Points: 1*

**As a** sprint planner or Copilot agent planning sprint scope,  
**I want** each requirement to optionally carry `depends_on: [req_id]`,  
**so that** prerequisite chains are machine-readable and sprint ordering is derivable
from the model without reading PLAN.md.

**Acceptance criteria:**
- `requirements.json`: each entry gains optional `depends_on: [] `
- Known prerequisite chains populated (e.g., EPIC-003 depends on EPIC-001, EPIC-002)
- Circular dependency check added to `validate-model.ps1`
- `validate-model.ps1` exits 0

---

### Feature dm-cat-f2 — Infrastructure Provision Order

---

**DM-CAT-WI-05 — provision_order on infrastructure**  
*Points: 1*

**As a** DevOps engineer running Bicep deployments,  
**I want** every infrastructure entry to carry `provision_order: int`,  
**so that** the canonical provisioning sequence is data-driven and matches the
module order in `18-azure-best/04-terraform-modules/`.

**Acceptance criteria:**
- Every entry in `infrastructure.json` gains `provision_order: int`
- Canonical order:
  ```
  1: Resource Group
  2: Key Vault, Storage Accounts
  3: Cosmos DB, AI Search
  4: Container Registry, OpenAI / AI Services
  5: App Service Plans
  6: Container Apps, Function Apps
  7: APIM (depends on all backend URLs)
  8: Application Insights (wired last)
  ```
- `validate-model.ps1` exits 0

---

### Feature dm-cat-f3 — Services Catalog Wave

---

**DM-CAT-WI-06 — Add 12 missing services**  
*Points: 2*

**As a** model consumer querying `GET /model/services`,  
**I want** all active EVA services—including foundry lib, red-teaming, CLI, control-plane,
devbench, jp-spark, ado-dashboard, and pipeline tools—to have entries,  
**so that** the ecosystem map is complete and `depends_on` graph traversal is accurate.

**Acceptance criteria:**
- 12 entries added to `services.json` (see Gap Analysis §2)
- Each entry carries correct `repo_path`, `type`, `status`, `depends_on`, `boot_order`, `deploy_order`
- `eva-brain-v1` added as `status: "archived"` (historical record)
- Total services ≥ 22
- `validate-model.ps1` exits 0

---

### Feature dm-cat-f4 — New Layers: mcp_servers + prompts

---

**DM-CAT-WI-07 — mcp_servers layer + schema**  
*Points: 2*

**As a** Copilot agent or DevOps engineer wiring MCP tools,  
**I want** the 3 MCP servers from 29-foundry cataloged as first-class model objects,  
**so that** endpoint ↔ MCP server cross-references are queryable via the model API.

**Acceptance criteria:**
- `model/mcp_servers.json` created with schema `$schema: ../schema/mcp_server.schema.json`
- Schema fields: `id`, `label`, `protocol`, `transport` (`stdio|sse|http`), `repo_path`, `tools: [tool_id]`, `auth_mode`, `depends_on`, `status`
- 3 entries: `mcp-azure-search`, `mcp-cosmos`, `mcp-blob`
- `api/routers/layers.py` registers the new layer router at `/model/mcp_servers`
- `validate-model.ps1` adds cross-ref: `mcp_servers[].depends_on` → `services[]`
- `validate-model.ps1` exits 0

---

**DM-CAT-WI-08 — prompts layer + schema**  
*Points: 1*

**As a** developer selecting prompt templates for a new feature,  
**I want** the 5 Prompty templates from 29-foundry cataloged with their
input/output schemas and linked endpoints,  
**so that** prompt versioning and usage tracking are model-driven.

**Acceptance criteria:**
- `model/prompts.json` created with schema `$schema: ../schema/prompt.schema.json`
- Schema fields: `id`, `label`, `template_path`, `model`, `input_schema`, `output_schema`, `used_by_endpoints: []`, `version`, `status`
- 5 entries (policy-analysis, claim-evaluation, precedent-finder, citation-generator, eligibility-validator)
- `validate-model.ps1` adds: `prompts[].used_by_endpoints` → `endpoints[]`
- `validate-model.ps1` exits 0

---

### Feature dm-cat-f5 — New Layer: security_controls

---

**DM-CAT-WI-09 — security_controls layer + schema**  
*Points: 3*

**As an** ATO / governance reviewer,  
**I want** ITSG-33, OWASP LLM Top 10, and MITRE ATLAS control entries in the model
linked to the requirements and endpoints they govern,  
**so that** evidence packs generated by 36-red-teaming are traceable to model objects
and ATO coverage is queryable without reading ATLAS-MAPPING.md manually.

**Acceptance criteria:**
- `model/security_controls.json` created with schema `$schema: ../schema/security_control.schema.json`
- Schema fields: `id`, `label`, `framework` (`itsg33|owasp_llm|atlas|nist_ai_rmf`), `control_ref`, `severity` (`critical|high|medium|low`), `mitigated_by: [endpoint_id | requirement_id]`, `eval_pack_path`, `status`
- Minimum entries: top-10 OWASP LLM controls + 5 ITSG-33 AC controls
- `validate-model.ps1`: `security_controls[].mitigated_by` → `endpoints[]` + `requirements[]`
- `GET /model/security_controls` available via standard layer router
- `validate-model.ps1` exits 0

---

### Feature dm-cat-f6 — Screens + Connections Wave

---

**DM-CAT-WI-10 — Add 9 missing screens**  
*Points: 1*

**As a** UI developer or sprint planner,  
**I want** screens for eva-jp-spark (6), ado-dashboard (2), and devbench (1)
cataloged in `screens.json`,  
**so that** screen count queries reflect the true surface area of the UI.

**Acceptance criteria:**
- 9 entries added (see Gap Analysis §4); each with `face`, `repo_path`, `component_path`, `status`, `api_calls: []`
- `jp-spark` screens linked to correct `eva-jp-spark` service
- `validate-model.ps1`: `screens[].api_calls` → `endpoints[]`
- `validate-model.ps1` exits 0

---

**DM-CAT-WI-11 — Add 5 missing connections**  
*Points: 1*

**As a** Copilot agent tracing the request path through APIM,  
**I want** APIM gateway and CLI adapters cataloged as `connections` layer entries,  
**so that** the full request routing chain (browser → APIM → brain-api → Cosmos) is
expressible in one model query.

**Acceptance criteria:**
- 5 entries added to `connections.json` (see Gap Analysis §5):
  - `connection-apim`: type `apim_gateway`, proxied_services: `["eva-brain-api", "eva-roles-api"]`
  - `connection-ado-model-bridge`, `connection-cli-ado`, `connection-cli-github`, `connection-cli-azure`
- APIM connection carries `injected_headers: [...]` (the `x-eva-*` headers from 17-apim)
- `validate-model.ps1` exits 0

---

## ADO Item Summary

| Type | ID | Title | Sprint | Points |
|------|----|-------|--------|--------|
| Epic | TBD | EVA Data Model — Catalog Wave & Precedence Fields | — | — |
| Feature | TBD | dm-cat-f1: Precedence Fields — Core Layers | — | — |
| Feature | TBD | dm-cat-f2: Infrastructure Provision Order | — | — |
| Feature | TBD | dm-cat-f3: Services Catalog Wave | — | — |
| Feature | TBD | dm-cat-f4: New Layers — mcp_servers + prompts | — | — |
| Feature | TBD | dm-cat-f5: New Layer — security_controls | — | — |
| Feature | TBD | dm-cat-f6: Screens + Connections Wave | — | — |
| WI | TBD | DM-CAT-WI-01: boot_order + deploy_order on services | Sprint-9 | 1 |
| WI | TBD | DM-CAT-WI-02: rank + supersedes on personas | Sprint-9 | 1 |
| WI | TBD | DM-CAT-WI-03: priority + auth_mode on feature_flags + endpoints | Sprint-9 | 1 |
| WI | TBD | DM-CAT-WI-04: depends_on on requirements | Sprint-9 | 1 |
| WI | TBD | DM-CAT-WI-05: provision_order on infrastructure | Sprint-9 | 1 |
| WI | TBD | DM-CAT-WI-06: 12 missing services | Sprint-9 | 2 |
| WI | TBD | DM-CAT-WI-07: mcp_servers layer + schema | Sprint-10 | 2 |
| WI | TBD | DM-CAT-WI-08: prompts layer + schema | Sprint-10 | 1 |
| WI | TBD | DM-CAT-WI-09: security_controls layer + schema | Sprint-10 | 3 |
| WI | TBD | DM-CAT-WI-10: 9 missing screens | Sprint-10 | 1 |
| WI | TBD | DM-CAT-WI-11: 5 missing connections | Sprint-10 | 1 |

**Sprint-9 total:** 7 points (precedence fields + services wave)  
**Sprint-10 total:** 8 points (new layers + screens + connections)

---

## Precedence Field Reference (canonical values)

### Services — boot_order
```
1  eva-roles-api              (no dependencies)
2  eva-brain-api              (depends: roles-api)
3  eva-data-model             (no runtime deps)
4  admin-face, chat-face      (depends: brain-api)
5  eva-control-plane          (depends: brain-api, data-model)
6  eva-devbench, eva-jp-spark (depends: brain-api)
7  eva-ado-command-center     (depends: control-plane)
8  eva-cli                    (depends: ado-command-center)
```

### Services — deploy_order (CI/CD pipeline stage)
```
1  infrastructure (Key Vault, Cosmos, Search, OpenAI, ACR)
2  platform services (roles-api, brain-api, data-model)
3  control plane (control-plane, ado-command-center)
4  frontends + tooling (faces, devbench, jp-spark, cli)
```

### Personas — rank
```
100  admin
 80  machine-agent
 60  auditor
 40  legal-researcher
 20  legal-clerk
 10  support
```

### Infrastructure — provision_order
```
1  Resource Group
2  Key Vault, Storage
3  Cosmos DB, AI Search
4  Container Registry, OpenAI, AI Services, Document Intelligence
5  App Service Plans
6  Container Apps, Function Apps
7  APIM
8  Application Insights
```

---

### Feature dm-cat-f7 — Infrastructure Accuracy & Completeness

---

**DM-CAT-WI-12 — Fix 3 infrastructure accuracy bugs**  
*Points: 1*

**As a** DevOps engineer reading the model for provisioning guidance,  
**I want** the infrastructure layer to reflect the correct resource names and types,  
**so that** automation scripts derived from the model don't target the wrong Azure resources.

**Accuracy bugs found (2026-02-22 scan):**

| Entry | Current value | Actual value | Source |
|-------|--------------|-------------|--------|
| `cosmos-database.azure_resource_name` | `eva-db` | `eva-foundation` | `.env.ado`, `.env.example` (COSMOS_DATABASE=eva-foundation) |
| `admin-static-web-app.type` | `container_app` | `static_web_app` | Azure Static Web Apps is a distinct resource type |
| `chat-static-web-app.type` | `container_app` | `static_web_app` | Same |
| `storage-account.azure_resource_name` | `eva-storage` | `marcosand20260203` | Actual sandbox account name |
| `cosmos-account.azure_resource_name` | `eva-cosmos-account` | `marco-sandbox-cosmos` | From `.env.ado` real endpoint |

**Acceptance criteria:**
- Entries above corrected in `infrastructure.json`
- `cosmos-database` `env_var` corrected from `AZURE_COSMOS_DATABASE` to match real env var
- `validate-model.ps1` exits 0

---

**DM-CAT-WI-13 — Add 3 missing infrastructure entries**  
*Points: 1*

**As a** DevOps engineer or CI/CD pipeline author,  
**I want** the Container Registry, Container App Environment, and Function App resources cataloged,  
**so that** the full Azure resource dependency graph is queryable from the model.

**Missing entries (no entry exists for these resource types):**

| id | type | azure_resource_name | notes |
|----|------|--------------------|---------|
| `container-registry` | `container_registry` | TBD (not yet provisioned) | Source images for brain-api, roles-api, agent-fleet Container Apps |
| `container-app-environment` | `container_app_environment` | TBD (not yet provisioned) | Shared ACA environment for all Container Apps |
| `function-app-ado-scrum` | `function_app` | TBD (not yet provisioned) | Runtime for `agent-ado-scrum` (`cp_agents`); `plane-ado` runtime_option |
| `storage-container-output` | `storage_container` | TBD | Processed document output blobs; only upload container is currently documented |
| `storage-container-evidence` | `storage_container` | TBD | Evidence pack archives from 40-eva-control-plane (`rb-001` step s-20) |

**Acceptance criteria:**
- 5 entries added to `infrastructure.json` with `status: "planned"` and `provision_order` per canonical order
- `provision_order` for Container Registry: 4; Container App Environment: 5; Function App: 6
- `validate-model.ps1` exits 0

---

**DM-CAT-WI-14 — Backfill real resource values into connections.json**  
*Points: 1*

**As a** Copilot agent or automation script consuming `GET /model/connections`,  
**I want** connections to carry the actual ADO org, GitHub org, Azure subscription, and resource group values,  
**so that** tooling can construct API calls from the model without reading deployment scripts.

**Real values discovered (2026-02-22 — source: `Deploy-FoundryProject.ps1`, `.env.ado`, `.env.example`):**

| Connection | Field | Current (placeholder) | Actual |
|-----------|-------|----------------------|--------|
| `connection-ado` | `endpoint` | `https://dev.azure.com/{org}` | `https://dev.azure.com/marcopresta` |
| `connection-ado` | `workspace_id` | `eva-poc` | `eva-poc` ✅ (correct) |
| `connection-azure` | `subscriptions` | `[]` | `["d2d4e571-e0f2-4f6c-901a-f88f7669bcba"]` |
| `connection-azure` | `resource_group` | — (missing) | `EsDAICoE-Sandbox` |
| `connection-azure` | `location` | — (missing) | `canadaeast` |
| (new) `connection-apim` | `azure_resource_name` | — | `marco-sandbox-apim` |
| (new) `connection-foundry` | `endpoint` | — | `https://marco-sandbox-foundry.cognitiveservices.azure.com/` |

**Acceptance criteria:**
- `connection-ado.endpoint` updated to real org URL
- `connection-azure` gains `subscriptions`, `resource_group`, `location` fields
- `connection-apim` entry added (see also dm-cat-f6 WI-11 — merge if both in same sprint)
- New `connection-foundry` entry added (type `azure_ai`, links to `openai-brain-deployment`)
- `validate-model.ps1` exits 0

---

### Feature dm-cat-f8 — CI/CD Pipeline Entries

---

**DM-CAT-WI-15 — Catalog existing CI/CD workflows**  
*Points: 1*

**As a** DevOps engineer or release manager,  
**I want** existing GitHub Actions and ADO pipeline YAMLs registered in the model,  
**so that** the automation landscape is visible and traceable to the services they deploy.

**Current inventory (2026-02-22 scan — only one real GH Actions file in the entire foundation):**

| File | Type | Service deployed | Status |
|------|------|-----------------|--------|
| `40-eva-devbench/.github/workflows/azure-static-web-apps.yml` | `github_actions` | `eva-devbench` | **active** — only working CI/CD in foundation |
| `44-eva-jp-spark/.github/workflows/ci.yml` | `github_actions` | `eva-jp-spark` | stub/early |
| `EVA-JP-v1.2/pipelines/*.yml` | `ado_pipeline` | Legacy EVA-JP-v1.2 | **out of scope** — old ESDC project |
| `33-eva-brain-v2` GH Actions | — | `eva-brain-api`, `eva-roles-api` | **MISSING — does not exist** |

**Acceptance criteria:**
- New `pipelines` field added to service entries (or a `ci_cd` sub-layer) with:
  - `pipeline_file` path, `type` (`github_actions|ado_pipeline`), `status` (`active|stub|missing`)
- `eva-devbench` service entry references the `azure-static-web-apps.yml` workflow
- `eva-brain-api`, `eva-roles-api` entries carry `pipeline_status: "missing"` as explicit gap
- `validate-model.ps1` exits 0

---

**DM-CAT-WI-16 — Gap ticket: brain-v2 CI/CD workflows needed**  
*Points: 0 (tracking only — implementation belongs to 33-eva-brain-v2)*

**As a** platform engineer,  
**I want** a tracked gap item for the absent GH Actions workflows on eva-brain-api and eva-roles-api,  
**so that** this isn't invisible until someone tries to deploy and finds nothing.

**What's missing:**
- `33-eva-brain-v2/.github/workflows/ci.yml` — test + coverage on PR
- `33-eva-brain-v2/.github/workflows/deploy.yml` — push-to-main → Container App deploy
- No IaC (Bicep/Terraform) for Container Apps, Container Registry, Container App Environment
- The only deploy scripts that exist target Foundry (`Deploy-FoundryProject.ps1`) and OpenAI (`deploy-gpt51-chat-v2.ps1`) — not the Container Apps

**Acceptance criteria:**
- ADO work item created in `33-eva-brain-v2` workstream referencing this gap
- `pipeline_status: "missing"` in model as per WI-15

---

### Feature dm-cat-f9 — Schema Completeness

---

**DM-CAT-WI-17 — Add AI Search index field mapping layer**  
*Points: 2*

**As a** developer tuning relevance or building a new index,  
**I want** the AI Search index field schema cataloged — field names, types, filterable/searchable/vector flags — in the model,  
**so that** the mapping is queryable without reading the Azure portal or raw index JSON.

**Gap:** `infrastructure.json` has `ai-search-index` (resource pointer) but there is no layer equivalent to `containers` for AI Search. The index has vector fields, filterable fields, and scoring profiles, none of which are documented in the model.

**Acceptance criteria:**
- New `search_indexes.json` layer (or entries in a new `search_indexes` section) with schema:
  - `id`, `azure_resource_name`, `service`, `fields: [{name, type, searchable, filterable, facetable, vector_dimensions}]`, `scoring_profiles`, `semantic_config`, `status`
- `proj10-index` entry added from actual index schema (pull via `az search index show` or existing `index-schema.json` in workspace root)
- Linked from `ai-search-index` infrastructure entry via `references` field
- `validate-model.ps1` exits 0

---

**DM-CAT-WI-18 — Add WI-5/WI-6 request/response schemas**  
*Points: 1*

**As a** front-end or integration developer,  
**I want** the Pydantic models introduced in WI-5 (logs, assistants) and WI-6 (apps CRUD) added to `schemas.json`,  
**so that** the schema catalog reflects the full API surface, not just the original Sprint 0-4 models.

**Missing schemas (confirmed by endpoint additions in this session):**

| Schema | Kind | Endpoints | Source |
|--------|------|-----------|--------|
| `AuditLogEntry` | response | `GET /v1/logs/audit*` | WI-5, logs.py |
| `ContentLogEntry` | response | `GET /v1/logs/content*` | WI-5, logs.py |
| `MathRequest` / `MathResponse` | request/response | `POST /v1/assistant/math/*` | WI-5, assistants.py |
| `TabularRequest` / `TabularResponse` | request/response | `POST /v1/assistant/tabular/*` | WI-5, assistants.py |
| `AppRegistryEntry` | model | `GET/POST/PATCH/DELETE /v1/apps*` | WI-6, apps.py |
| `AppRegistryRequest` | request | `POST /v1/apps`, `PATCH /v1/apps/{id}` | WI-6, apps.py |

**Acceptance criteria:**
- 8 schema entries added to `schemas.json` with `kind`, `defined_in`, `used_by`, `fields`, `status: "implemented"`
- `validate-model.ps1`: `schemas[].used_by` → `endpoints[]` (cross-ref check)
- `validate-model.ps1` exits 0

---

## ADO Item Summary

| Type | ID | Title | Sprint | Points |
|------|----|-------|--------|--------|
| Epic | TBD | EVA Data Model — Catalog Wave & Precedence Fields | — | — |
| Feature | TBD | dm-cat-f1: Precedence Fields — Core Layers | — | — |
| Feature | TBD | dm-cat-f2: Infrastructure Provision Order | — | — |
| Feature | TBD | dm-cat-f3: Services Catalog Wave | — | — |
| Feature | TBD | dm-cat-f4: New Layers — mcp_servers + prompts | — | — |
| Feature | TBD | dm-cat-f5: New Layer — security_controls | — | — |
| Feature | TBD | dm-cat-f6: Screens + Connections Wave | — | — |
| Feature | TBD | dm-cat-f7: Infrastructure Accuracy & Completeness | — | — |
| Feature | TBD | dm-cat-f8: CI/CD Pipeline Entries | — | — |
| Feature | TBD | dm-cat-f9: Schema Completeness | — | — |
| WI | TBD | DM-CAT-WI-01: boot_order + deploy_order on services | Sprint-9 | 1 |
| WI | TBD | DM-CAT-WI-02: rank + supersedes on personas | Sprint-9 | 1 |
| WI | TBD | DM-CAT-WI-03: priority + auth_mode on feature_flags + endpoints | Sprint-9 | 1 |
| WI | TBD | DM-CAT-WI-04: depends_on on requirements | Sprint-9 | 1 |
| WI | TBD | DM-CAT-WI-05: provision_order on infrastructure | Sprint-9 | 1 |
| WI | TBD | DM-CAT-WI-06: 12 missing services | Sprint-9 | 2 |
| WI | TBD | DM-CAT-WI-07: mcp_servers layer + schema | Sprint-10 | 2 |
| WI | TBD | DM-CAT-WI-08: prompts layer + schema | Sprint-10 | 1 |
| WI | TBD | DM-CAT-WI-09: security_controls layer + schema | Sprint-10 | 3 |
| WI | TBD | DM-CAT-WI-10: 9 missing screens | Sprint-10 | 1 |
| WI | TBD | DM-CAT-WI-11: 5 missing connections | Sprint-10 | 1 |
| WI | TBD | DM-CAT-WI-12: Fix 3 infrastructure accuracy bugs | Sprint-9 | 1 |
| WI | TBD | DM-CAT-WI-13: Add 3 missing infra entries (ACR, ACA env, Func) | Sprint-9 | 1 |
| WI | TBD | DM-CAT-WI-14: Backfill real resource values in connections.json | Sprint-9 | 1 |
| WI | TBD | DM-CAT-WI-15: Catalog existing CI/CD workflows | Sprint-10 | 1 |
| WI | TBD | DM-CAT-WI-16: Gap ticket — brain-v2 CI/CD missing | Sprint-10 | 0 |
| WI | TBD | DM-CAT-WI-17: AI Search index field mapping layer | Sprint-10 | 2 |
| WI | TBD | DM-CAT-WI-18: Add WI-5/WI-6 request/response schemas | Sprint-9 | 1 |

**Sprint-9 total:** 7 + 4 = **11 points** (precedence + services + infra accuracy/completeness + WI-5/WI-6 schemas)  
**Sprint-10 total:** 8 + 4 = **12 points** (new layers + screens + connections + CI/CD catalog + search schema)

---

## Not In Scope

- `20-AssistMe` legacy corpus (separate migration decision required — see roadmap)
- `18-azure-best` knowledge modules (reference library, not operational objects)
- `42-learn-foundry` sandbox (reference only — not imported by production code)
- `35-agentic-code-fixing` spike patterns (graduate to 29-foundry when ready)
- EVA-JP-v1.2 legacy ESDC pipeline YAMLs (belong to old platform, not eva-foundation)

---

*Source scan: `33-eva-brain-v2/docs/ADO/20260222-to-be-cataloged.md` (2026-02-22)*  
*Infrastructure / CI/CD section added 2026-02-22 from live workspace scan (Deploy-FoundryProject.ps1, .env.ado, .env.example, GH Actions file inventory).*
