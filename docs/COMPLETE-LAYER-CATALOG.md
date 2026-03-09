================================================================================
 EVA DATA MODEL -- COMPLETE LAYER CATALOG
 File: docs/COMPLETE-LAYER-CATALOG.md
 Updated: 2026-03-09 -- 87 operational layers; 24 planned; 12 ontology domains
 Source: https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io
 Design: docs/library/98-model-ontology-for-agents.md (12-domain cognitive architecture)
         docs/library/99-layers-design-20260309-0935.md (75-layer canonical numbering)
         docs/architecture/EXECUTION-LAYERS-ASSESSMENT.md (L52-L75 phased plan)
================================================================================

  PURPOSE
  -------
  Single source of truth for what layers exist, how many objects each holds,
  and how agents use them during the DPDCA lifecycle.

  Agents query by LAYER NAME (GET /model/{layer_name}/), not by L-number.
  L-numbers are historical identifiers from the 75-layer canonical design.
  Organic layers (added by agents or sessions) may not have L-numbers.
  That is fine. The ontology domain is what matters for reasoning.

  GROWTH MODEL
  ------------
  Layers grow organically. Any agent or session may propose new layers
  when operational needs emerge. The 12-domain ontology absorbs them.

  Current operational:  87 layers  (51 canonical L1-L51 + 36 organic)
  Planned (L52-L75):   24 layers  (Execution Engine + Strategy)
  Total when complete: 111+ layers (and growing)

  AGENT LIFECYCLE MAPPING
  -----------------------
  Each domain serves a phase of the agent DPDCA cycle:

    DISCOVER  --> System Architecture, Identity, AI Runtime, Control Plane
                  Agent reads: what exists, who am I, what tools do I have
    PLAN      --> Project & PM, Strategy & Portfolio, Governance
                  Agent reads: WBS, stories, tasks, sprints, rules, gates
    DO        --> Execution Engine, DevOps & Delivery, AI Runtime
                  Agent executes: work units, deployments, tests
    CHECK     --> Governance & Policy, Observability & Evidence
                  Agent validates: gates passed, evidence recorded, metrics OK
    ACT       --> Observability, Infrastructure & FinOps, Project & PM
                  Agent writes: evidence, costs, metrics, updates backlog

================================================================================
 DOMAIN 1 -- SYSTEM ARCHITECTURE
 "How the system is built"
 Agent lifecycle: DISCOVER (learn what exists)
================================================================================

  Layer                       L#    Objects   Status
  --------------------------  ----  --------  ------
  services                    L1    36        operational
  containers                  L4    13        operational
  endpoints                   L5    187       operational
  schemas                     L6    39        operational
  infrastructure              L10   46        operational
  eva_model                   L48   36        operational
  api_contracts               --    6         operational (organic)
  error_catalog               --    22        operational (organic)
  request_response_samples    --    18        operational (organic)
  tech_stack                  --    19        operational (organic)

  Subtotal: 10 layers, 422 objects

================================================================================
 DOMAIN 2 -- IDENTITY & ACCESS
 "Who can do what"
 Agent lifecycle: DISCOVER (learn permissions and actors)
================================================================================

  Layer                       L#    Objects   Status
  --------------------------  ----  --------  ------
  personas                    L2    10        operational
  security_controls           L22   10        operational
  secrets_catalog             --    30        operational (organic)

  Subtotal: 3 layers, 50 objects

================================================================================
 DOMAIN 3 -- AI RUNTIME
 "Who performs intelligent work"
 Agent lifecycle: DISCOVER + DO (load config, then execute)
================================================================================

  Layer                       L#    Objects   Status
  --------------------------  ----  --------  ------
  agents                      L9    13        operational
  prompts                     L21   5         operational
  mcp_servers                 L20   4         operational
  agent_policies              L36   4         operational
  agentic_workflows           --    30        operational (organic)
  instructions                --    15        operational (organic)

  Subtotal: 6 layers, 71 objects

================================================================================
 DOMAIN 4 -- USER INTERFACE
 "How users interact with the system"
 Agent lifecycle: DO (generate/modify UI)
================================================================================

  Layer                       L#    Objects   Status
  --------------------------  ----  --------  ------
  screens                     L7    50        operational
  literals                    L8    458       operational
  components                  L23   32        operational
  hooks                       L24   19        operational
  ts_types                    L25   26        operational

  Subtotal: 5 layers, 585 objects

================================================================================
 DOMAIN 5 -- CONTROL PLANE
 "How the system operates internally"
 Agent lifecycle: DISCOVER + DO (load orchestration, execute workflows)
================================================================================

  Layer                       L#    Objects   Status
  --------------------------  ----  --------  ------
  planes                      L12   3         operational
  connections                 L13   4         operational
  environments                L14   3         operational
  cp_skills                   L15   7         operational
  cp_agents                   L16   4         operational
  runbooks                    L17   4         operational
  cp_workflows                L18   2         operational
  cp_policies                 L19   3         operational
  feature_flags               L3    15        operational
  config_defs                 --    20        operational (organic)
  env_vars                    --    138       operational (organic)
  runtime_config              --    45        operational (organic)

  Subtotal: 12 layers, 248 objects

================================================================================
 DOMAIN 6 -- GOVERNANCE & POLICY
 "Rules the factory must follow"
 Agent lifecycle: PLAN + CHECK (read rules before, validate after)
================================================================================

  Layer                       L#    Objects   Status
  --------------------------  ----  --------  ------
  workspace_config            L34   1         operational
  quality_gates               L37   4         operational
  github_rules                L38   4         operational
  validation_rules            L41   4         operational
  risks                       L30   5         operational
  decisions                   L31   4         operational
  compliance_audit            L45   6         operational
  architecture_decisions      --    36        operational (organic)
  decision_provenance         --    35        operational (organic)
  remediation_policies        --    3         operational (organic)

  Subtotal: 10 layers, 102 objects

================================================================================
 DOMAIN 7 -- PROJECT & PRODUCT MANAGEMENT
 "What is being built"
 Agent lifecycle: PLAN + ACT (read backlog, update progress)
================================================================================

  Layer                       L#    Objects   Status
  --------------------------  ----  --------  ------
  requirements                L11   29        operational
  projects                    L26   56        operational
  wbs                         L27   3292      operational
  sprints                     L28   20        operational
  milestones                  L29   4         operational
  project_work                L35   3         operational
  stories                     --    55        operational (organic)
  tasks                       --    73        operational (organic)
  session_transcripts         --    43        operational (organic)

  Subtotal: 9 layers, 3575 objects

  NOTE: WBS supports BOTH waterfall (work breakdown) and agile (epic/feature/story).
        Synced with ADO via 38-ado-poc integration.
        stories + tasks are the agile execution view of the same backlog.

================================================================================
 DOMAIN 8 -- DEVOPS & DELIVERY
 "How software is delivered"
 Agent lifecycle: DO + RECORD (deploy, test, record results)
================================================================================

  Layer                       L#    Objects   Status
  --------------------------  ----  --------  ------
  deployment_policies         L39   4         operational
  testing_policies            L40   4         operational
  deployment_records          L47   2         operational
  deployment_quality_scores   L46   4         operational
  ci_cd_pipelines             --    15        operational (organic)
  deployment_history          --    76        operational (organic)
  deployment_targets          --    21        operational (organic)
  repos                       --    20        operational (organic)
  synthetic_tests             --    46        operational (organic)
  test_cases                  --    80        operational (organic)

  Subtotal: 10 layers, 272 objects

================================================================================
 DOMAIN 9 -- OBSERVABILITY & EVIDENCE
 "What happened"
 Agent lifecycle: CHECK + ACT (validate, record proof)
================================================================================

  Layer                       L#    Objects   Status
  --------------------------  ----  --------  ------
  evidence                    L33   120       operational
  traces                      L32   0         operational (empty)
  agent_execution_history     L42   5         operational
  agent_performance_metrics   L43   15        operational
  performance_trends          L50   4         operational
  auto_fix_execution_history  --    3         operational (organic)
  coverage_summary            --    72        operational (organic)
  evidence_correlation        --    40        operational (organic)
  model_telemetry             --    50        operational (organic)
  remediation_outcomes        --    6         operational (organic)
  remediation_effectiveness   --    2         operational (organic)
  verification_records        --    60        operational (organic)
  workflow_metrics            --    30        operational (organic)

  Subtotal: 13 layers, 407 objects

  NOTE: Evidence (L33) is the COMPETITIVE MOAT.
        Only AI coding platform with immutable DPDCA audit trails.
        Polymorphic schema with tech_stack-specific validation.

================================================================================
 DOMAIN 10 -- INFRASTRUCTURE & FINOPS
 "What resources the factory consumes"
 Agent lifecycle: ACT + CHECK (record costs, detect drift)
================================================================================

  Layer                       L#    Objects   Status
  --------------------------  ----  --------  ------
  azure_infrastructure        L44   36        operational
  infrastructure_drift        L49   4         operational
  resource_costs              L51   5         operational
  cost_tracking               --    40        operational (organic)
  cost_allocation             --    0         operational (empty)
  infrastructure_events       --    0         operational (empty)
  resource_inventory          --    0         operational (empty)
  service_health_metrics      --    0         operational (empty)
  usage_metrics               --    0         operational (empty)

  Subtotal: 9 layers, 85 objects (5 layers awaiting seed data)

================================================================================
 DOMAIN 11 -- EXECUTION ENGINE (PLANNED)
 "How work gets done"
 Agent lifecycle: DO (the core production runtime)
================================================================================

  Layer                       L#    Objects   Status
  --------------------------  ----  --------  ------
  work_execution_units        L52   --        planned (Phase 1)
  work_step_events            L53   --        planned (Phase 1)
  work_decision_records       L54   --        planned (Phase 1)
  work_obligations            L55   --        planned (Phase 2)
  work_outcomes               L56   --        planned (Phase 1)
  work_learning_feedback      L57   --        planned (Phase 2)
  work_reusable_patterns      L58   --        planned (Phase 2)
  work_pattern_applications   L59   --        planned (Phase 3)
  work_pattern_perf_profiles  L60   --        planned (Phase 3)
  work_factory_capabilities   L61   --        planned (Phase 4)
  work_factory_services       L62   --        planned (Phase 4)
  work_service_requests       L63   --        planned (Phase 4)
  work_service_runs           L64   --        planned (Phase 4)
  work_service_perf_profiles  L65   --        planned (Phase 4)
  work_service_level_objs     L66   --        planned (Phase 4)
  work_service_breaches       L67   --        planned (Phase 5)
  work_service_remed_plans    L68   --        planned (Phase 5)
  work_service_reval_results  L69   --        planned (Phase 5)
  work_service_lifecycle      L70   --        planned (Phase 5)

  Subtotal: 19 layers, 0 objects (Phase 1 = L52/L53/L54/L56, see EXECUTION-LAYERS-ASSESSMENT.md)

================================================================================
 DOMAIN 12 -- STRATEGY & PORTFOLIO (PLANNED)
 "Why the factory evolves"
 Agent lifecycle: DISCOVER + PLAN (strategic context, investment decisions)
================================================================================

  Layer                       L#    Objects   Status
  --------------------------  ----  --------  ------
  work_factory_portfolio      L71   --        planned (Phase 6)
  work_factory_roadmaps       L72   --        planned (Phase 6)
  work_factory_investments    L73   --        planned (Phase 6)
  work_factory_decisions      L74   --        planned (Phase 6)
  work_factory_authorizations L75   --        planned (Phase 6)

  Subtotal: 5 layers, 0 objects (Phase 6, see EXECUTION-LAYERS-ASSESSMENT.md)

================================================================================
 SUMMARY
================================================================================

  Domain                        Layers   Objects   Status
  ----------------------------  ------   -------   ------
  1. System Architecture        10       422       operational
  2. Identity & Access          3        50        operational
  3. AI Runtime                 6        71        operational
  4. User Interface             5        585       operational
  5. Control Plane              12       248       operational
  6. Governance & Policy        10       102       operational
  7. Project & PM               9        3575      operational
  8. DevOps & Delivery          10       272       operational
  9. Observability & Evidence   13       407       operational
  10. Infrastructure & FinOps   9        85        operational (5 empty)
  11. Execution Engine          19       0         planned L52-L70
  12. Strategy & Portfolio      5        0         planned L71-L75
  ----------------------------  ------   -------   ------
  TOTAL                         111      5817      87 operational, 24 planned

================================================================================
 AGENT BOOTSTRAP SEQUENCE
================================================================================

  An agent instantiated by GitHub Actions follows this exact path:

  1. HEALTH CHECK
     GET /health
     --> confirms store=cosmos, returns agent_guide link

  2. LOAD INSTRUCTIONS
     GET /model/agent-guide
     --> 6 sections: discovery_journey, query_capabilities, write_cycle,
         common_mistakes, forbidden_actions, quick_reference

  3. LOAD CONTEXT (single call)
     GET /model/agent-summary
     --> all layer names + object counts (this catalog as live data)

  4. LOAD ASSIGNMENT
     GET /model/wbs/?project_id={project}&status=active
     GET /model/stories/?sprint_id={sprint}&status=not_started
     GET /model/tasks/?story_id={story}
     --> waterfall (wbs) + agile (stories/tasks), ADO-synced

  5. LOAD RULES
     GET /model/agent_policies/{agent_id}
     GET /model/quality_gates/?project_id={project}
     GET /model/governance/?scope=workspace
     --> what rules apply to this work

  6. EXECUTE (fractal DPDCA per task)
     foreach task:
       DISCOVER: read relevant layers for context
       PLAN: define approach, check gates
       DO: execute work, query/write model as needed
       CHECK: validate results against quality gates
       ACT: record evidence, update backlog

  7. RECORD BACK TO MODEL
     PUT /model/evidence/{id}          --> proof of completion
     PUT /model/verification_records/  --> test/lint results
     PUT /model/workflow_metrics/      --> timing, cost, tokens
     PUT /model/session_transcripts/   --> session narrative

  8. SYNC
     ADO <-> model sync via 38-ado-poc
     Model evergreening: counts, statuses, metrics auto-update

================================================================================
 THE COGNITIVE LOOP
================================================================================

  Strategy -----> Projects -----> Execution -----> Agents
      ^                                              |
      |                                              v
  Governance <--- Metrics <----- Evidence <----- Services
      |                                              |
      v                                              v
  Strategy (refine) ---------> Deployment -----> Infrastructure

  This is the EVA AI reasoning loop.
  Agents do not think in 87 layers.
  They think in 12 domains.
  The ontology compresses the model into a cognitive architecture.

================================================================================
 GROWTH POLICY
================================================================================

  New layers are created when:
  1. An operational need emerges that no existing layer covers
  2. The new layer fits one of the 12 ontology domains
  3. A schema is defined (JSON Schema Draft-07)
  4. The layer is registered in the API (server.py router)

  No rigid L-numbering required for organic layers.
  L-numbers (L1-L75) are the canonical design from the 75-layer catalog.
  Organic layers get names only. The API indexes by name, not number.

  When a new domain emerges (beyond 12), the ontology extends.
  The model is alive. It grows with the factory.

================================================================================
 EMPTY LAYERS REQUIRING SEED DATA
================================================================================

  Layer                    Domain                    Priority
  -----------------------  ------------------------  --------
  traces                   Observability             medium (LLM telemetry)
  cost_allocation          Infrastructure & FinOps   high (FinOps attribution)
  infrastructure_events    Infrastructure & FinOps   medium (event stream)
  resource_inventory       Infrastructure & FinOps   high (Azure resource sync)
  service_health_metrics   Infrastructure & FinOps   medium (health probes)
  usage_metrics            Infrastructure & FinOps   low (consumption tracking)

================================================================================
 DATA SOURCES
================================================================================

  Layer counts from: GET /model/agent-summary (live API, March 9, 2026)
  Ontology design:   docs/library/98-model-ontology-for-agents.md
  Layer design:      docs/library/99-layers-design-20260309-0935.md
  Execution plan:    docs/architecture/EXECUTION-LAYERS-ASSESSMENT.md
  API protocol:      docs/library/03-DATA-MODEL-REFERENCE.md

================================================================================
