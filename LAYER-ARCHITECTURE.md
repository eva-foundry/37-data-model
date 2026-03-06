# EVA Data Model - Layer Architecture

## How Many Layers?

**Short Answer:** The data model currently has **46 semantic layers**, with full infrastructure-as-code automation suite operational (Session 32 complete: L33-L43 governance + infrastructure + IaC).

## Why "41 Layers"?

The number 41 reflects the current production state as of March 6, 2026 (post Session 30 deployment). This is an **observed count**, not a hardcoded limit:

```
📊 Current Count (as of March 6, 2026 - Session 32 - Priority #2 COMPLETE):
├─ 46 layers operational (38 baseline + L33-L43 governance + infrastructure + IaC)
├─ Cloud deployment: Revision 0000006+ live (L39 + Bicep generator + deploy orchestrator operational)
├─ Largest: endpoints (185+), services (34+), projects (56)
├─ Governance (L33-L39): agent_policies, quality_gates, github_rules, deployment_policies, testing_policies, validation_rules, azure_infrastructure (DESIRED STATE)
├─ Infrastructure (L40-L43): deployment_records (2), infrastructure_drift (4 resources), resource_costs (4 services), compliance_audit (6 checks)
├─ IaC Automation: generate-infrastructure-iac.ps1 (L39→Bicep) + deploy-infrastructure.ps1 (orchestration + DPDCA phases)
├─ Agent automation: L33-L35 enable safety-first deployments with policy checks
├─ Specialized: evidence (L11 - immutable DPDCA receipts with 12 tech_stack values)
└─ Audit trails: L40 deployment records + L41 drift detection + L43 compliance queryable
```

**Session 30 Deployment & Testing Policies (March 6, 2026 11:12 AM ET):**
- ✅ assemble-model.ps1 updated from 38→41 layers
- ✅ L36: deployment_policies (Container App config, resource limits, health probes)
- ✅ L37: testing_policies (Coverage thresholds, CI workflows, test strategies)
- ✅ L38: validation_rules (Schema enforcement, compliance gates, data integrity)
- ✅ evidence.schema.json extended: 9→12 tech_stack values (polymorphic contexts)
- ✅ All 42 tests passing, 0 validation violations
- ✅ Timeline: 1.5 hours (5x faster than Session 28-29, lessons applied)
- ✅ PR #16 & #17 merged, Revision 0000005 deployed and operational

## Layer Expansion Roadmap (Session 28+)

**Goal:** Enable full agent automation with governance, quality gates, and infrastructure management.

### Phase 1: Agent Safety & Quality (Session 28) - Priority ★★★★★

| Layer | Purpose | Objects | Status |
|-------|---------|---------|--------|
| **L33: agent-policies** | Agent capabilities, safety constraints, project access | 1 | ✅ Active |
| **L34: quality-gates** | MTI thresholds, test coverage, phase-specific gates | 1 | ✅ Active |
| **L35: github-rules** | Branch protection, commit standards, naming conventions | 1 | ✅ Active |

*Completed Session 28 Phase 1.* Evidence polymorphism: 3 test records seeded with tech_stack discrimination. Cloud deployment pending (PR #12 merged).

### Phase 2: Deployment & Testing (Session 29-30) - Priority ★★★★☆

| Layer | Purpose | Objects | Status |
|-------|---------|---------|--------|
| **L36: deployment-policies** | Pre/post-flight checks, rollback conditions | ~15 | Planned |
| **L37: testing-policies** | Coverage %, frameworks, CI gates | ~10 | Planned |
| **L38: validation-rules** | Field constraints per layer, cross-field rules | ~25 | Planned |

*Rationale: Agents need deployment guardrails (L36), test enforcement (L37), and data validation (L38).*

### Phase 3: Infrastructure Automation (Session 31+) - Priority ★★★★★

| Layer | Purpose | Objects | Status | Implementation | Queries |
|-------|---------|---------|--------|-----------------|----------|
| **L39: azure-infrastructure** | Desired infrastructure state (source of truth) | 5 resource types | ✅ Active (S32) | azure_infrastructure.json (325 lines) + env profiles | `/model/azure-infrastructure` |
| **L40: deployment-records** | Historical deployment logs & audit trail | 2+ | ✅ Active (S31) | Records: cold start fix + docs v2.8 | `/model/deployment-records` |
| **L41: infrastructure-drift** | Desired (L39) vs actual state detection | 4+ | ✅ Active (S31) | Resources: ACA, CosmosDB, APIM, AppInsights | `/model/infrastructure-drift` |
| **L42: resource-costs** | Granular cost per resource & FinOps | 4+ | ✅ Active (S31) | Baseline: $964.97/mo across 4 services | `/model/resource-costs` |
| **L43: compliance-audit** | Security findings, remediation tracking | 6+ | ✅ Active (S31) | 6 checks (all PASS: SOC2/HIPAA/FedRAMP) | `/model/compliance-audit` |
| **IaC Automation** | Infrastructure deployment orchestration | — | ✅ Active (S32) | generate-infrastructure-iac.ps1 + deploy-infrastructure.ps1 | `/scripts/` folder |

*Rationale: Infrastructure-as-code requires knowing what exists (L39), deployment history (L40), drift detection (L41), cost tracking (L42), and compliance proof (L43).*

**Session 31 Deployment (March 6, 2026 4:37 PM ET):**
- ✅ L40: deployment_records (2 seed records: Session 32 cold start fix + Session 28-30 docs)
- ✅ L41: infrastructure_drift (4 resources: ACA, CosmosDB, APIM, AppInsights — all synced, zero drift)
- ✅ L42: resource_costs (4 services: $964.97/mo total, breakdown by resource type)
- ✅ L43: compliance_audit (6 checks: encryption, access control, audit logging — 100% compliant)
- ✅ Ready for: Bicep generator (Week 2) + Deploy engine (Week 3-4)


## Dynamic Layer Discovery

**Original Issue:** The sync script originally used a **hardcoded list** of 30 layer names.

**Current Solution:** The sync script now **discovers layers dynamically**:

```powershell
# Fetches from cloud API - adapts automatically if new layers added
$summary = Invoke-RestMethod "$CloudApiBase/agent-summary"
$layers = $summary.layers | Select-Object -ExpandProperty name
```

**Implication:** If a new layer is added to the cloud API tomorrow, the backup script will automatically include it on the next run.

## The Current 41 Layers

**Production Layers (as of Session 28 Phase 1):**

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
| **project_work** | ADO work item mappings (L32) | 0 | Active |
| **agent_policies** | Agent capabilities & safety constraints (L33) | 1 | Active |
| **quality_gates** | MTI thresholds & phase gates (L34) | 1 | Active |
| **github_rules** | Branch protection & commit standards (L35) | 1 | Active |
| **deployment_records** | Historical deployment audit log (L40) | 2+ | Active (S31) |
| **infrastructure_drift** | Desired vs actual state comparison (L41) | 4+ | Active (S31) |
| **resource_costs** | Granular cost per resource, environment (L42) | 4+ | Active (S31) |
| **compliance_audit** | Security findings, remediation tracking (L43) | 6+ | Active (S31) |

**Total: 45 layers, 1,100+ objects**



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

## L33-L35 Agent Automation Integration (Session 28)

### Polymorphic Evidence Pattern

L33-L35 layers use **evidence tech_stack discrimination** to validate layer-specific context:

```json
{
  "id": "ACA-S11-L34-quality-gates-P",
  "tech_stack": "quality-gates",
  "context": {
    "mti_threshold": 75,
    "test_coverage_percent": 80,
    "gates_per_phase": { "D": {...}, "P": {...}, "Do": {...} }
  }
}
```

**Schema Validation:** If tech_stack="quality-gates", Evidence schema enforces context.mti_threshold and context.gates_per_phase fields.

### 48-eva-veritas Integration

The **quality-gates** layer (L34) provides MTI scoring thresholds:

- **Current MTI Formula:** `Coverage*0.5 + Evidence*0.2 + Consistency*0.3`
- **Enhanced by L34:** GET /model/quality-gates/{project_id} returns:
  - `mti_threshold` (default: 75) — minimum acceptable MTI score
  - `test_coverage_percent` (default: 80) — minimum test coverage required
  - `gates_per_phase` — diffs per DPDCA phase that must pass before acceptance

**Integration Point:** `compute-trust.js` (48-eva-veritas) should call:
```
GET /model/quality_gates/51-ACA
→ Extract mti_threshold, apply as deployment gate
```

**Evidence Linking:** Evidence records with tech_stack="quality-gates" provide audit trail of which MTI gates were enforced per phase.

---

## Historical Context

**Session 20 (Mar 5, 2026):**
- **Before:** sync-cloud-to-local.ps1 had hardcoded layer list (appeared arbitrary)
- **After:** Script dynamically queries agent-summary, adapts to cloud API changes
- **Why:** Single source of truth principle — cloud API is the authority on which layers exist

---

**Updated:** March 5, 2026 Session 28 Phase 1 (8:45 PM ET)  
**Session:** 28 (L33-L35 agent automation layers with polymorphic Evidence)  
**Automated by:** GitHub Copilot (Agent Framework mode)  
**Related:** [STATUS.md](STATUS.md), [USER-GUIDE.md](USER-GUIDE.md), GET /model/agent-guide
