================================================================================
 09-EVA-ORCHESTRATOR.md
 EVA Data Model + Veritas -- Project Intelligence Narrative
 Location: 37-data-model/docs/library/
 Version:  1.0.0
 Date:     2026-02-26
 EO-ID:    EO-09-001
================================================================================

This document is the authoritative narrative of how 37-data-model and
48-eva-veritas evolved from compensatory infrastructure into a live project
intelligence layer -- and how that layer unexpectedly became a dependency
orchestrator for blocked AI sessions.

ASCII only. No emoji. No Mermaid. Printable.

--------------------------------------------------------------------------------
 PART 1 -- THE PROBLEM THEY SOLVE TOGETHER
--------------------------------------------------------------------------------

Every AI agent that touches the EVA codebase faces a choice at the start of
each session: grep source files or query structured knowledge. Grepping costs
10 tool turns. A single HTTP call to a structured API costs 1. That observation
is the founding principle of the entire effort.

The corollary: a project whose requirements, endpoints, screens, containers, and
sprint history all exist as machine-queryable nodes -- and a tool that can scan
any repo, compute how much of its planned work is actually traceable to
implementation, and express that as a single score -- together form something
genuinely new: a project intelligence layer that makes every AI agent smarter
and every governance audit instantaneous.

That is what 37-data-model and 48-eva-veritas are building, together.


--------------------------------------------------------------------------------
 PART 2 -- THE UNEXPECTED CAPABILITY: DEPENDENCY ORCHESTRATION
--------------------------------------------------------------------------------

On 2026-02-26, a BRAIN session working on 31-eva-faces (Phase 2 WI-20, H1
brain-v2 handshake) hit a wall. Every terminal command was blocked. Every
grep was blocked. The session could have been aborted. Instead, the agent
did something unexpected: it queried the data model API.

  GET /model/endpoints/GET /v1/settings
    -> .implemented_in = "services/eva-brain-api/app/routes/settings.py"
    -> .cosmos_reads   = ["settings"]
    -> .cosmos_writes  = []
    -> .auth           = ["admin", "legal-researcher"]

  GET /model/containers/settings
    -> .cosmos_endpoint env var = "AZURE_COSMOS_ENDPOINT"

  GET /model/services/eva-brain-api
    -> .env_vars = ["ROLES_API_URL", "AZURE_COSMOS_ENDPOINT", "DEV_BYPASS_OID"]

  GET /model/graph/?node_id=eva-brain-api&depth=2
    -> edges: eva-brain-api --calls--> roles-api
              eva-brain-api --reads--> settings (container)
              settings --hosted-by--> cosmos (infrastructure)

Each of those was 1 HTTP call. Together they produced the root cause: the ACA
revision of eva-brain-api had AZURE_COSMOS_ENDPOINT=placeholder. No terminal
needed. No file grep. The dependency chain was in the model.

The model was not designed to be a dependency debugger. It became one because
it held the right data -- cross-referenced, typed, queryable -- and an agent
with no other tools could still navigate it.

THIS IS THE ORCHESTRATOR PATTERN.

Not a central coordinator. Not a workflow engine. An intelligence substrate
that remains queryable even when all imperative tools are blocked -- and that
returns enough structured context to unblock a session that would otherwise
have to abort.


--------------------------------------------------------------------------------
 PART 3 -- 37-DATA-MODEL: THE EVOLUTION
--------------------------------------------------------------------------------

 Week 1 (Feb 20-22): 11 Layers in 3 Days
 -----------------------------------------

The project started as a strict discipline exercise. No more grepping.
Every significant object -- a service, an endpoint, a screen, a persona --
gets a typed JSON record with explicit cross-references. The first three layers
(services, personas, feature_flags) were a proof of concept. Then it accelerated.

By Feb 22: 11 layers (application model: services, personas, flags,
containers, endpoints, schemas, screens, literals, agents, infrastructure,
requirements). Each layer had a JSON schema. validate-model.ps1 enforced
cross-reference integrity.

Two critical features shipped simultaneously:

  POST /model/admin/export  -- full write cycle: materialise in-memory store
                               to disk JSON with audit columns

  GET  /model/graph/        -- typed edge traversal across all layers
                               304 nodes, 533 edges on first run
                               20 typed edge kinds: calls, reads, writes,
                               depends_on, renders, ...

The .repo_line field + backfill script: every endpoint and component stamped
with file path and line number of its handler. Navigation from model record
to source: 0 grep turns.


 Feb 23: Cosmos Wired, PROD Gap Analysis
 -----------------------------------------

The API ran on MemoryStore -- every restart wiped state. A critical bug:
Dockerfile --workers 2 gave each uvicorn worker its own in-process store.
Writes on worker A were invisible to worker B. 50% of reads under load
returned stale state. Fixed: dropped to --workers 1, then moved to Cosmos.

Cosmos wired: real credentials, 866 objects seeded, store=cosmos confirmed.
ACA container app marco-eva-data-model deployed and live. Both local dev and
ACA read from and write to the same Cosmos container -- 24x7.

11 PROD gap items (PROD-1 to PROD-11). Critical path:
  - Startup guard (fallback to MemoryStore if Cosmos unreachable)
  - Admin token hardening
  - Export-before-shutdown (preserve MemoryStore state on SIGTERM)
All three implemented.


 Feb 24: Catalog Expansion + Two-Portal Architecture
 -----------------------------------------------------

The model grew from a backend spec into a full-platform catalog.
46 screens across two portals registered. Architectural decision ratified:

  assistant-face (20 screens): citizens + RAG -- auth, EVA DA chat,
    JP Spark, AssistMe, A11y themes, i18n
  ops-face (26 screens): admin + operations -- RBAC, ADO, DataModel,
    RedTeam, DevBench

184 endpoints registered. Control plane catalog (Layers 11-17): planes,
connections, environments, CP skills, CP agents, runbooks, compiled
workflow definitions. Frontend structural layers (L18-L20): React
components, custom hooks, TypeScript type definitions. Catalog and ops
layers (L21-L24): MCP servers, Prompty templates, OWASP/ITSG-33 security
controls, operational runbooks. Project plane (L25-26): projects + WBS.

GitHub Actions CI gate (validate-model.yml): any PR touching model/** or
schema/** triggers assemble-model.ps1 + validate-model.ps1. Fails exit 1
and block the merge.


 Feb 25: IFPUG, DPDCA + Veritas Convergence
 --------------------------------------------

Two architectural moves sealed the model as a MEASUREMENT PLATFORM.

 IFPUG Function Point stamping:

   transaction_function_type (EI/EO/EQ) added to endpoint schema.
   data_function_type (ILF/EIF) added to container schema.
   stamp-tft.ps1 / stamp-dft.ps1 ran against all 76 implemented endpoints
   and 13 containers.

   Current stamp counts (2026-02-25, session 16c):
     EI=23  EO=25  EQ=28  (endpoints)
     ILF=12  EIF=1         (containers)

   GET /model/fp/estimate returns:
     UFP (Unadjusted Function Points)
     UFP * 2.4  = story-point estimate (COCOMO II)
     UFP * 0.5  = effort-days (2 FP/person-day industry average)

 DPDCA evolution plane (Layers 27-30):

   L27 sprints   -- velocity records, MTI-at-close, ADO iteration path
   L28 milestones -- RUP phase gates
   L29 risks     -- 3x3 scoring matrix
   L30 decisions -- Architecture Decision Records (ADRs)

   Seeded (session 16c):
     9 sprints, 4 milestones, 5 risks, 4 decisions

 Mermaid graph output:

   GET /model/graph/?format=mermaid returns flowchart LR diagram (plain text).
   Any Mermaid renderer consumes it directly.

 Readiness probe (readiness-probe.ps1) formalised as 10 gates (G01-G10):

   G01 ACA reachability         PASS
   G02 Cosmos store             PASS
   G03 FP endpoint availability PASS
   G04 TFT stamping             PASS
   G05 DFT stamping             PASS
   G06 Sprint seeding           PASS (9 records)
   G07 DPDCA layer availability PASS
   G08 Veritas MTI integration  PASS
   G09 Consumer portfolio MTI   WARN (MTI=86, below 95 target)
   G10 Graph endpoint access    PASS

   9/9 PASS. G09 WARN is a consumer-side issue (31-eva-faces, 33-eva-brain-v2)
   not a data-model defect.


 Current Snapshot (2026-02-26)
 ------------------------------

   Layers:              31
   Total objects:     4055 (Cosmos-backed, 24x7)
   Endpoints reg:      184 (76 implemented, 108 stubs)
   Endpoints stamped:   76 (EI=23, EO=25, EQ=28)
   Containers:          13 (ILF=12, EIF=1)
   Screens:             46 (20 assistant-face, 26 ops-face)
   Sprints:              9
   Milestones:           4
   Risks:                5
   Decisions:            4
   WBS records:       3234 (1 program, 4 streams, 51 projects, 751 features,
                            2427 stories -- ADO IDs linked)
   Tests:            41/42 PASS (T36 pre-existing race condition only)


--------------------------------------------------------------------------------
 PART 4 -- 48-EVA-VERITAS: THE EVOLUTION
--------------------------------------------------------------------------------

 Origin: A POC That Proved Itself in One Day (Feb 24)
 ------------------------------------------------------

Started as 48-eva-orchestrator (renamed immediately). One session, one day:
  - 15 source files
  - 5-command CLI pipeline: discover / reconcile / compute-trust /
    generate-ado / report
  - Self-audit: MTI=60 on the tool itself

Two hours later renamed to 48-eva-veritas. The name change was a statement:
not an experiment -- infrastructure.

Initial MTI formula (3 components):
  Coverage * 0.50 + Evidence * 0.20 + Consistency * 0.30

  Coverage:    planned stories with code artifacts
  Evidence:    stories with .eva/ receipts
  Consistency: STATUS.md story-status matching actual artifact state

  Actions: deploy / merge / review-required / block / add-governance
  Rule: below 70 = no deploy, no merge.


 Phase 2: MCP Server + Three-Way Integration (Feb 24 afternoon)
 ---------------------------------------------------------------

MCP server: 5 tools registered in mcp.json as eva-veritas (stdio transport,
auto-starts with VS Code).

  audit_repo          Full discover+reconcile+trust pipeline
  get_trust_score     MTI score + component breakdown
  get_coverage        Stories total, with artifacts, with evidence
  generate_ado_items  Epic/Feature/Story/Task ADO work items
  scan_portfolio      Per-project trust scores + portfolio MTI average

Three simultaneous integrations:

  -> 37-data-model:
       POST /model/admin/audit-repo added.
       Veritas pushes audit results into the model store.
       Integration reference: docs/library/08-EVA-VERITAS-INTEGRATION.md

  -> 38-ado-poc:
       generate-ado maps veritas gaps to ADO PBIs.
       Reads .eva/gaps.json, generates sprint-importable CSV.
       OpenAPI spec importer + ADO CSV plan importer added.

  -> 29-foundry:
       Veritas MCP server added to 29-foundry/mcp-servers/eva-veritas/
       Registered as skill #07 in 29-foundry skill catalog (72 -> 73 skills).
       Any foundry agent can call audit_repo as a first-class tool.


 Phase 3: generate-plan (Zero-Friction Onboarding)
 ---------------------------------------------------

Barrier removed: projects needed PLAN.md in a specific format. generate-plan
reads ANY governance document format and emits .eva/veritas-plan.json.

  Input formats supported:
    ## Phase N  |  ## Sprint N  |  ## Feature:  |  ### Story:
    checklist items (- [ ] ...)  |  headings of any depth

4-level ADO hierarchy rule codified:
  ## h2  -> Feature
  ### h3 -> User Story (SCORED UNIT)
  #### h4 / - [ ] under h3 -> Task
  - [ ] directly under h2 -> also User Story (IS the decomposition level)

This rule prevented the majority of false MTI=0 readings on legacy projects.


 Phase 4+5: Portfolio Bootstrap (Feb 25 morning)
 -------------------------------------------------

Critical bug fixed: all source files had UTF-8 BOM. Node v24 silently failed
to parse them. Six portfolio sweeps had produced zero results. BOM stripped.
Sweep 6: 36 projects with coverage=100%, MTI >= 50 immediately.

Full bootstrap sequence:

  normalize-plans.ps1  43/49 PLAN.md files normalized to F{NN} prefix format
  auto-tag.ps1         913 EVA-STORY tags injected into 75 source files
  sweep-all.ps1        49 projects audited; 6 pure-docs -> manifest.yml;
                       7 empty -> minimal PLAN.md
  wbs-import.ps1       3234 WBS records PUT to data model
  endpoint-link.ps1    186 endpoints + 46 screens linked to WBS story IDs
  wbs-to-ado.ps1       42 ADO artifact files -> 1920 PBIs, 42/42 imported

full-bootstrap.ps1 captures the entire 8-phase sequence as a repeatable
playbook.


 Phase 6-7: DPDCA Wiring + 4th MTI Component (Feb 25 late morning)
 -------------------------------------------------------------------

Four missing wires closed:

  Wire 1 (ADO IDs):      1880 WBS records updated with integer ADO ado_id
                          via PUT to ACA. Every WBS story -> direct FK to ADO.

  Wire 2 (ADO state):    1869 WBS records verified. ADO "New" -> "planned".
                          State sync confirmed.

  Wire 3 (Control Plane): 6 sprint run records + 6 evidence artifacts seeded
                            into port 8020 (wbs-import, ado-seed, endpoint-link,
                            writeback, state-sync, test-ids).

  Wire 4 (Test IDs):     requirements.test_ids populated via:
                          satisfied_by -> endpoint -> wbs_id chain.
                          2 requirements now have test_ids arrays.

ADO-WBS field sync (wbs-ado-sync.ps1): sprint_id, story_points, owner
propagated from ADO into WBS model layer. 1869 records updated live.

 4th MTI Component -- Complexity Coverage:

   enrich.js: post-reconcile step calls GET /model/fp/estimate and related
   endpoints, annotates each story with:
     endpoint_count, container_count, fp_weight, complexity

   Result written to .eva/enrichment.json.
   trust.js reads enrichment and computes 4th component.

   FINAL MTI FORMULA (4 components):

     Coverage            * 0.40
     Evidence            * 0.20
     Consistency         * 0.25
     Complexity Coverage * 0.15
     --------------------------------
     MTI (0..100)

   Fallback: when no enrichment data, complexity_coverage = 0 and
   remaining three weights revert to 0.50 / 0.20 / 0.30.
   Backwards compatible. The 4th component cannot be non-zero without
   IFPUG stamping in 37-data-model -- the two systems are coupled.


--------------------------------------------------------------------------------
 PART 5 -- THE ARCHITECTURE THEY FORM TOGETHER
--------------------------------------------------------------------------------

  37-data-model (ACA / Cosmos 24x7, port 8010 local dev)
  |
  |  31 layers: services, endpoints, screens, containers, agents,
  |             requirements, wbs, sprints, risks, decisions, ...
  |
  |  GET /model/fp/estimate          IFPUG UFP + story-point + effort-days
  |  GET /model/graph/?format=mermaid full cross-layer dependency diagram
  |  GET /model/impact?container=X   blast radius analysis
  |  GET /model/agent-summary        1-call bootstrap: all 31 layer counts
  |
  ^-- reads for complexity (fp_weight, endpoint_count, container_count)
  |
  48-eva-veritas (MCP server, port 8031)
  |
  |  discover.js      parse PLAN.md or veritas-plan.json, scan source files
  |  reconcile.js     compute coverage, gaps, consistency
  |  enrich.js        call data model API, annotate stories with FP complexity
  |  trust.js         4-component MTI (coverage/evidence/consistency/complexity)
  |  report.js        human-readable + .eva/ evidence folder
  |  audit.js         orchestrate full pipeline
  |  model-audit.js   cross-reference model integrity vs filesystem
  |
  v-- writes audit results back to 37-data-model (POST /model/admin/audit-repo)
  v-- writes gaps to 38-ado-poc (generate-ado CSV -> sprint PBIs)
  v-- writes evidence to 40-eva-control-plane (run records + artifacts)

The two systems form a BI-DIRECTIONAL INTELLIGENCE LOOP:

  - Veritas scans repos and calls the data model to enrich stories with
    FP complexity.
  - The data model provides the canonical cross-reference graph and IFPUG
    weight tables.
  - Veritas computes trust and writes results back to the model and control
    plane.
  - The model's sprint layer records MTI-at-close per sprint, turning trust
    scores into a velocity-correlated trend.
  - The WBS layer links every story in every repo to its ADO work item and
    its endpoint/screen coverage.


--------------------------------------------------------------------------------
 PART 6 -- THE ORCHESTRATOR PATTERN IN PRACTICE
--------------------------------------------------------------------------------

The screenshot that named this capability shows a BRAIN session that:

  1. Was blocked on Phase 2 WI-20 (H1 brain-v2 handshake not done) because
     31-eva-faces was running VITE_USE_MOCK_BACKEND=true.

  2. Attempted to run terminal commands to investigate -- blocked.
     Attempted to grep source files -- blocked.

  3. Switched to data model HTTP calls.

     Each blocked imperative action was replaced by a declarative query:

     INSTEAD OF: grep -r "ROLES_API_URL" services/
     USED:       GET /model/services/eva-brain-api  -> .env_vars

     INSTEAD OF: cat services/eva-brain-api/app/routes/settings.py
     USED:       GET /model/endpoints/GET /v1/settings -> .implemented_in
                 + .cosmos_reads -> pinpointed Cosmos dependency

     INSTEAD OF: az containerapp env vars list ...
     USED:       GET /model/services/eva-brain-api -> .env_vars
                 confirmed AZURE_COSMOS_ENDPOINT key name

     INSTEAD OF: read .env.ado, .env, brain-v2 env configs
     USED:       GET /model/graph/?node_id=eva-brain-api&depth=2
                 -> full dependency chain in one call

  4. Root cause identified: AZURE_COSMOS_ENDPOINT=placeholder.documents.azure.com
     on the ACA revision. The data model held the env var name, the Cosmos
     container it maps to, and the endpoint that read from it.

  5. Fix path derived entirely from model data. No imperative tools needed
     for the diagnostic phase.

This is not a designed feature. The model was built as a catalog and query
layer. The ORCHESTRATOR capability emerged from the combination of:

  a) Cross-referenced data (endpoint -> container -> infrastructure -> env var)
  b) Stable HTTP interface (queryable even when terminals are blocked)
  c) Sufficient depth (implemented_in, repo_line, cosmos_reads, env_vars)

The lesson: a model that is complete enough to answer "what calls what" is
complete enough to replace grep-based debugging for the diagnostic phase of
any blocked session.


--------------------------------------------------------------------------------
 PART 7 -- WHERE IT IS GOING
--------------------------------------------------------------------------------

 Near term (next sprint -- actions already clear):

  DM-MAINT-WI-2 (Same-PR enforcement):
    GitHub Action on every PR touching api/** or source. Checks whether any
    source file changed without a corresponding model PUT. Closes the "model
    drift" class of bugs at the commit boundary.

  DM-MAINT-WI-3 (Scheduled drift detection):
    Cron job compares GET /model/endpoints/filter?status=implemented against
    actual implemented_in file list. Drift reported as Cosmos-backed audit
    record feeding the readiness probe.

  Portfolio MTI above 95 (G09 resolution):
    Requires audit_repo on 31-eva-faces and 33-eva-brain-v2. Toolchain is
    complete. Sprint cycle drives the score.

  39-ado-dashboard velocity:
    G07 PASS (9 sprint records) unblocks velocity panel. Sprint dates and
    story points in ADO -> wbs-ado-sync.ps1 -> WBS layer -> dashboard.


 Medium term (architectural ambitions):

  Dependency audit in CI:
    dependency-audit.js exists in src/. Promote to GitHub Action that blocks
    PRs when a declared WBS dependency has a mismatched implementation state.
    Trust score becomes a first-class gate, not a dashboard metric.

  Real-time drift signal to CD pipeline:
    DM-MAINT-WI-2 + readiness probe = preconditions for a CD gate:
    only deploy when readiness-probe.ps1 exits 0 AND portfolio MTI >= 95.
    The ado_iteration_path field per sprint is one integration away from
    stamping the deployed revision against a sprint record.

  Full FP-to-ADO cycle:
    UFP * 2.4 story points and UFP * 0.5 effort-days already computable.
    Feed those estimates back into ADO PBI story points fields automatically.
    Model becomes the authoritative sizing tool, not just a reporting tool.

  Browser UI as operator console:
    /model and /model/report routes in portal-face are live. Unified view:
    MTI per project (from veritas), FP estimate (from data model fp endpoint),
    sprint velocity (from L27 sprints), open gaps (from veritas .eva/gaps.json).
    Every stakeholder number in one screen, backed by the same Cosmos store.


 The long arc:

The two projects started as compensatory infrastructure -- a way to stop agents
from grepping source files and to give governance more than a checkbox process.
They are evolving into a continuously computed, machine-enforced contract
between what is planned, what is implemented, and what is deployed.

Trust is not a review artifact you file at the end of a sprint. It is a live
number, computed from code, linked to ADO work items, stamped with IFPUG
complexity, gated at the PR boundary, and -- as the blocked BRAIN session
showed -- queryable as a dependency resolver even when all imperative tools
are unavailable.

The ORCHESTRATOR pattern is not a feature. It is what happens when a model
is built correctly.


--------------------------------------------------------------------------------
 FILE REFERENCES
--------------------------------------------------------------------------------

  37-data-model/api/routers/fp.py            IFPUG UFP calculation
  37-data-model/api/routers/graph.py         Typed edge traversal + Mermaid
  37-data-model/api/routers/impact.py        Blast radius analysis
  37-data-model/scripts/readiness-probe.ps1  10-gate readiness check
  37-data-model/scripts/stamp-tft.ps1        Transaction function type stamping
  37-data-model/scripts/stamp-dft.ps1        Data function type stamping
  37-data-model/USER-GUIDE.md                v2.5 -- agent operating protocol
  48-eva-veritas/src/enrich.js               FP complexity annotation
  48-eva-veritas/src/lib/trust.js            4-component MTI formula
  48-eva-veritas/src/model-audit.js          Cross-reference vs filesystem
  48-eva-veritas/src/scan-portfolio.js       Portfolio-wide MTI sweep
  docs/library/08-EVA-VERITAS-INTEGRATION.md Veritas <-> data model API wiring

================================================================================
 END OF 09-EVA-ORCHESTRATOR.md
================================================================================
