================================================================================
 EVA DATA MODEL -- SCREEN REGISTRY METADATA MAPPING
 File: docs/SCREEN-TO-LAYER-MAPPING.md
 Updated: 2026-03-13
 Purpose: Map all 173 screen registry IDs to their actual layer identifiers
 Source of Truth: screen-registry-bulk-upload.jsonl + COMPLETE-LAYER-CATALOG.md
================================================================================

## Overview

The screen registry contains 173 entries with the following structure:
- **51 actual L-layer screens**: L1-L51 (operational layers generating UI)
- **24 planned L-layer screens**: L52-L75 (future layers)
- **98 secondary screens**: eva-faces-page-*, project-screen-*, ops-*, etc.

This document defines how each screen ID maps to an actual layer name for UI generation.

================================================================================
## SECTION 1: OPERATIONAL LAYER SCREENS (L1-L51)
Generates UI: Yes | Status: Production | Layer count: 51
================================================================================

| Screen ID | Layer Name | Domain | Purpose |
|-----------|-----------|--------|---------|
| L1 | services | System Architecture | Service definitions and API contracts |
| L2 | personas | Identity & Access | User roles and access patterns |
| L3 | feature_flags | Control Plane | Feature toggle management |
| L4 | containers | System Architecture | Container configurations |
| L5 | endpoints | System Architecture | API endpoint definitions |
| L6 | schemas | System Architecture | Data model schemas |
| L7 | screens | User Interface | UI screen definitions |
| L8 | literals | User Interface | UI text constants and labels |
| L9 | agents | AI Runtime | Agent definitions and capabilities |
| L10 | infrastructure | System Architecture | Infrastructure resource groups |
| L11 | requirements | Infrastructure & FinOps | System requirements and constraints |
| L12 | planes | Control Plane | Plane definitions (control, data, etc.) |
| L13 | connections | Control Plane | Connections between components |
| L14 | environments | Control Plane | Deployment environments (dev, staging, prod) |
| L15 | cp_skills | Control Plane | Control plane skills and capabilities |
| L16 | cp_agents | Control Plane | Control plane agents |
| L17 | runbooks | Control Plane | Operational runbooks |
| L18 | cp_workflows | Control Plane | Control plane workflows |
| L19 | cp_policies | Control Plane | Control plane policies |
| L20 | mcp_servers | AI Runtime | MCP (Model Context Protocol) server definitions |
| L21 | prompts | AI Runtime | LLM prompt templates |
| L22 | security_controls | Identity & Access | Security control implementations |
| L23 | components | User Interface | Reusable UI components |
| L24 | hooks | User Interface | React hooks and custom hooks |
| L25 | ts_types | User Interface | TypeScript type definitions |
| L26 | projects | Project & PM | Project definitions and metadata |
| L27 | wbs | Project & PM | Work breakdown structure |
| L28 | sprints | Project & PM | Sprint definitions and schedules |
| L29 | milestones | Project & PM | Project milestones and gates |
| L30 | risks | Governance & Policy | Risk registry and assessments |
| L31 | decisions | Governance & Policy | Architecture and strategic decisions |
| L32 | traces | Observability & Evidence | Distributed tracing data |
| L33 | evidence | Observability & Evidence | Evidence collection and audit trail |
| L34 | workspace_config | Governance & Policy | Workspace-wide configuration |
| L35 | project_work | Project & PM | Current project work items |
| L36 | agent_policies | AI Runtime | Agent behavior policies |
| L37 | quality_gates | Governance & Policy | Quality gate definitions |
| L38 | github_rules | Governance & Policy | GitHub workflow rules |
| L39 | deployment_policies | DevOps & Delivery | Deployment policy definitions |
| L40 | testing_policies | DevOps & Delivery | Testing policy definitions |
| L41 | validation_rules | Governance & Policy | Validation and compliance rules |
| L42 | agent_execution_history | Observability & Evidence | Agent execution logs and history |
| L43 | agent_performance_metrics | Observability & Evidence | Agent performance data |
| L44 | azure_infrastructure | Infrastructure & FinOps | Azure infrastructure details |
| L45 | compliance_audit | Data & Analytics | Compliance audit records |
| L46 | deployment_quality_scores | DevOps & Delivery | Quality metrics for deployments |
| L47 | deployment_records | DevOps & Delivery | Deployment history and records |
| L48 | eva_model | System Architecture | EVA data model reference |
| L49 | infrastructure_drift | Infrastructure & FinOps | Infrastructure change tracking |
| L50 | performance_trends | Infrastructure & FinOps | Performance trend analysis |
| L51 | resource_costs | Infrastructure & FinOps | Resource cost allocation |

================================================================================
## SECTION 2: PHASE 1 EXECUTION LAYERS (L52-L54)
Generates UI: Yes | Status: Phase 1 Deployed | Layer count: 3
================================================================================

| Screen ID | Layer Name | Domain | Purpose |
|-----------|-----------|--------|---------|
| L52 | work_execution_units | Execution Engine | Atomic units of work execution |
| L53 | work_step_events | Execution Engine | Step-level execution events |
| L54 | work_decision_records | Execution Engine | Decision records during execution |

================================================================================
## SECTION 3: PHASES 2-6 EXECUTION LAYERS (L55-L75)
Generates UI: No (Planned) | Status: Planned | Layer count: 21
================================================================================

| Screen ID | Layer Name | Phase | Purpose |
|-----------|-----------|-------|---------|
| L55 | work_obligations | Phase 2 | Work obligations and commitments |
| L56 | work_outcomes | Phase 2 | Expected and actual work outcomes |
| L57 | work_learning_feedback | Phase 2 | Learning records and feedback loops |
| L58 | work_reusable_patterns | Phase 2 | Reusable work patterns and templates |
| L59 | work_pattern_applications | Phase 3 | Applications of work patterns |
| L60 | work_pattern_perf_profiles | Phase 3 | Performance profiles for patterns |
| L61 | work_factory_capabilities | Phase 4 | Work factory capabilities available |
| L62 | work_factory_services | Phase 4 | Services provided by work factory |
| L63 | work_service_requests | Phase 4 | Service requests to work factory |
| L64 | work_service_runs | Phase 4 | Service execution runs |
| L65 | work_service_perf_profiles | Phase 4 | Service performance profiles |
| L66 | work_service_level_objs | Phase 4 | Service level objectives (SLOs) |
| L67 | work_service_breaches | Phase 5 | Service breach records |
| L68 | work_service_remed_plans | Phase 5 | Service remediation plans |
| L69 | work_service_reval_results | Phase 5 | Service re-evaluation results |
| L70 | work_service_lifecycle | Phase 5 | Service lifecycle management |
| L71 | work_factory_portfolio | Phase 6 | Portfolio of work factory services |
| L72 | work_factory_roadmaps | Phase 6 | Work factory roadmaps |
| L73 | work_factory_investments | Phase 6 | Investment decisions for work factory |
| L74 | work_factory_decisions | Phase 6 | Strategic decisions for work factory |
| L75 | work_factory_authorizations | Phase 6 | Authorization and approval records |

================================================================================
## SECTION 4: SECONDARY SCREEN IDS (NOT LAYER IDs)
Generates UI: No UI generation (not actual layers) | Status: Legacy/Other | Count: 98
================================================================================

These are NOT layer IDs and should NOT generate data model UI components.
They represent either:
- Organic screen definitions (not backed by data model layers)
- Test/example screens
- Legacy screen identifiers

**A. Eva Faces Pages (23 screens)**
```
eva-faces-page-1 through eva-faces-page-23
```
**Purpose**: Example/demonstration screens for EVA Faces project
**Layer mapping**: None (organic, not model-backed)

**B. Project 39 Screens (3 screens)**
```
project-39-EVAHomePage
project-39-EVAHomePage.test
project-39-SprintBoardPage
project-39-SprintBoardPage.test
```
**Purpose**: Example screens from Project 39 (EVA dashboard proof-of-concept)
**Layer mapping**: None (organic)

**C. Project Screen Series (9 screens)**
```
project-screen-1 through project-screen-9
```
**Purpose**: Generic project screen placeholders
**Layer mapping**: None (placeholder/reference)

**D. Miscellaneous Screens (63+ screens**
```
ops-scaling
ops-<variant>
<various other identifiers>
```
**Purpose**: Operational and other concept screens
**Layer mapping**: None (not model layers)

================================================================================
## IMPLEMENTATION RULES

### Rule 1: Layer ID vs Screen ID
- If screen ID matches `L[0-9]+` format → It's a layer ID → Generate UI components
- If screen ID doesn't match → It's a secondary screen → Do NOT generate UI

### Rule 2: UI Generation Decision Tree
```
Input: screen registry entry with id="<ID>"
├─ Does <ID> match L[0-9]+ ?
│  ├─ YES → Look up in SECTION 1/2/3 mapping
│  │   ├─ Found → Generate UI (LAYER_NAME, ENTITY_TYPE)
│  │   └─ Not found → Treat as planned layer, generate L<N> directory
│  └─ NO → Skip UI generation (not a model layer)
```

### Rule 3: Metadata as Source of Truth
- **For L1-L54**: Use mapping above (operational + Phase 1)
- **For L55-L75**: Use mapping above (planned, marked as "placeholder")
- **For eva-faces-*, project-screen-*, ops-***: Do NOT generate
- **For unknown IDs**: Fallback to ID.toLower() directory name

### Rule 4: API-First Bootstrap (Preferred)
```powershell
# If available, fetch from /model/layer-metadata endpoint
$metadata = Invoke-RestMethod "$base/model/layer-metadata"

# Fallback: Use embedded mapping from this file
```

================================================================================
## INTEGRATION GUIDE

### For UI Screen Generator
1. Load screen-registry-bulk-upload.jsonl
2. For each entry with id="<ID>":
   - Check if <ID> matches L[0-9]+ pattern
   - If YES: Look up <ID> in this mapping to get layer_name
   - If NO: Skip (not a layer)
3. Generate UI components only for valid layer IDs

### Example Usage (PowerShell)
```powershell
$layerIdMap = @{
    "L1"   = "services"
    "L2"   = "personas"
    "L3"   = "feature_flags"
    # ... (complete mapping from Section 1-3)
}

if ($layerIdMap.ContainsKey($screenId)) {
    $layerName = $layerIdMap[$screenId]
    # Generate UI components for $layerName
} else {
    # Skip non-layer screens
}
```

================================================================================
## MAINTENANCE

**Update frequency**: Whenever new layers are added to the data model
**Update trigger**: Session closure for layer additions
**Owner**: Project 37 (EVA Data Model)
**Review cycle**: Monthly workspace audit

To update this mapping:
1. Extract new entries from COMPLETE-LAYER-CATALOG.md
2. Add to appropriate section (1, 2, or 3)
3. Update "Layer count" summary at section headers
4. Commit to EVA repository with evidence link

