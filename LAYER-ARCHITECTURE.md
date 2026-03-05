# EVA Data Model - Layer Architecture

## How Many Layers?

**Short Answer:** The data model currently has **33 semantic layers**, with **10 additional layers planned** for agent automation (target: 43+ layers by Session 30).

## Why "33 Layers"?

The number 33 reflects the current production state as of March 5, 2026 8:28 PM ET. This is an **observed count**, not a hardcoded limit:

```
📊 Current Count (as of March 5, 2026 8:28 PM ET):
├─ 33 layers operational in cloud (msub-eva-data-model endpoint)
├─ 4,400+ objects distributed across layers
├─ Largest: endpoints (186), services (34), projects (56)
├─ Newest: workspace_config (L32), project_work (L33), wbs (L26)
└─ Specialized: evidence (L31 - immutable DPDCA receipts)
```

## Layer Expansion Roadmap (Session 28+)

**Goal:** Enable full agent automation with governance, quality gates, and infrastructure management.

### Phase 1: Agent Safety & Quality (Session 28) - Priority ★★★★★

| Layer | Purpose | Objects | Status |
|-------|---------|---------|--------|
| **L33: agent-policies** | Agent capabilities, safety constraints, project access | ~10 | Planned |
| **L34: quality-gates** | MTI thresholds, test coverage, phase-specific gates | ~20 | Planned |
| **L35: github-rules** | Branch protection, commit standards, naming conventions | ~15 | Planned |

*Rationale: Safety first. Before agents deploy, they need policies (L33), quality thresholds (L34), and Git rules (L35).*

### Phase 2: Deployment & Testing (Session 29-30) - Priority ★★★★☆

| Layer | Purpose | Objects | Status |
|-------|---------|---------|--------|
| **L36: deployment-policies** | Pre/post-flight checks, rollback conditions | ~15 | Planned |
| **L37: testing-policies** | Coverage %, frameworks, CI gates | ~10 | Planned |
| **L38: validation-rules** | Field constraints per layer, cross-field rules | ~25 | Planned |

*Rationale: Agents need deployment guardrails (L36), test enforcement (L37), and data validation (L38).*

### Phase 3: Infrastructure Automation (Session 31+) - Priority ★★★☆☆

| Layer | Purpose | Objects | Status |
|-------|---------|---------|--------|
| **L39: azure-infrastructure** | Resource inventory, health, compliance | ~50 | Planned |
| **L40: deployment-records** | Historical deployment logs | ~500 | Future |
| **L41: infrastructure-drift** | Desired vs actual state detection | ~20 | Future |
| **L42: resource-costs** | Granular cost per resource | ~100 | Future |
| **L43: compliance-audit** | Security findings, remediation tracking | ~30 | Future |

*Rationale: Infrastructure-as-code requires knowing what exists (L39), deployment history (L40), and drift detection (L41).*



## Dynamic Layer Discovery

**Original Issue:** The sync script originally used a **hardcoded list** of 30 layer names.

**Current Solution:** The sync script now **discovers layers dynamically**:

```powershell
# Fetches from cloud API - adapts automatically if new layers added
$summary = Invoke-RestMethod "$CloudApiBase/agent-summary"
$layers = $summary.layers | Select-Object -ExpandProperty name
```

**Implication:** If a new layer is added to the cloud API tomorrow, the backup script will automatically include it on the next run.

## The Current 33 Layers

**Production Layers (as of Session 27):**

| Layer | Purpose | Typical Count | Status |
|-------|---------|---------------|--------|
| **services** | Backend services, APIs, microservices | 34 | Active |
| **personas** | User roles, agent identities | 10 | Active |
| **feature_flags** | A/B tests, gradual rollouts | 15 | Active |
| **containers** | Cosmos DB containers (schema source) | 13 | Active |
| **endpoints** | HTTP endpoints (METHOD /path) | 186 | Active |
| **schemas** | JSON Schema definitions | 33 | Active |
| **screens** | UI screens + API calls | 22 | Active |
| **literals** | UI strings, translations | 272 | Active |
| **agents** | AI agents (Copilot, custom) | 8 | Active |
| **infrastructure** | Hosts, networks, DNS | 6 | Active |
| **requirements** | Epics, features, stories, PBIs | 45 | Active |
| **planes** | Control/data/management planes | 5 | Active |
| **connections** | Service-to-service dependencies | 18 | Active |
| **environments** | dev, staging, prod configs | 4 | Active |
| **cp_skills** | Control plane agent skills | 12 | Active |
| **cp_agents** | Control plane agents | 5 | Active |
| **runbooks** | Operational procedures | 8 | Active |
| **cp_workflows** | Control plane workflows | 6 | Active |
| **cp_policies** | Control plane policies | 10 | Active |
| **mcp_servers** | MCP server registrations | 7 | Active |
| **prompts** | LLM prompt templates | 15 | Active |
| **security_controls** | Auth, RBAC, encryption | 20 | Active |
| **components** | UI components, libraries | 30 | Active |
| **hooks** | Event listeners, triggers | 12 | Active |
| **ts_types** | TypeScript type definitions | 50 | Active |
| **projects** | All 56 numbered project folders | 56 | Active |
| **wbs** | Work breakdown structure (L26) | 869 | Active |
| **sprints** | Sprint metadata (51-ACA, portfolio) | 25 | Active |
| **milestones** | Release milestones | 8 | Active |
| **risks** | Project risks + mitigations | 12 | Active |
| **decisions** | Architectural decisions | 18 | Active |
| **traces** | Distributed tracing | 100+ | Active |
| **evidence** | DPDCA receipts (L31) | 62 | Active |
| **workspace_config** | Workspace governance (L32) | 1 | Active |
| **project_work** | ADO work item mappings (L33) | 0 | Active |

**Total: 33 layers, 4,400+ objects**



## Why Not a Fixed List?

In AI research and MAT (Model Augmentation Technology):
- **Ontologies evolve**: New relationships require new layers
- **Scaling**: As EVA grows (agents, projects, evidence), layer organization may change
- **Experimentation**: New layer types are tested before promotion

## For Developers

When working with the data model:

✅ **DO:** Query `agent-summary` to learn current layer structure  
✅ **DO:** Write code that iterates over discovered layers (not hardcoded lists)  
✅ **DO:** Assume the data model is a growing/evolving system  

❌ **DON'T:** Hardcode layer names or counts  
❌ **DON'T:** Assume "30 layers" is permanent  
❌ **DON'T:** Skip layers because they weren't in an old script  

## Historical Context

**Session 20 (Mar 5, 2026):**
- **Before:** sync-cloud-to-local.ps1 had hardcoded layer list (appeared arbitrary)
- **After:** Script dynamically queries agent-summary, adapts to cloud API changes
- **Why:** Single source of truth principle — cloud API is the authority on which layers exist

---

**Updated:** March 5, 2026 8:28 PM ET  
**Session:** 27 (USER-GUIDE simplification + layer expansion planning)  
**Automated by:** GitHub Copilot (Agent Framework mode)  
**Related:** [STATUS.md](STATUS.md), [USER-GUIDE.md](USER-GUIDE.md), GET /model/agent-guide
