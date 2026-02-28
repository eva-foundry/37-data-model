================================================================================
 EVA DATA MODEL -- FK ENHANCEMENT (SIEBEL-STYLE RELATIONAL INTEGRITY)
 File: docs/library/10-FK-ENHANCEMENT.md
 Updated: 2026-02-28 -- Opus 4.6 reviewed, CONDITIONAL GO, 403h/12 sprints
 Status: Approved design, Phase 0 start March 2026
 Source docs: docs/FK-ENHANCEMENT-*.md (4 documents, ~7000 lines total)
================================================================================

  PURPOSE
  -------
  Transform the EVA Data Model from loose string-array coupling to explicit
  PK/FK relationships with referential integrity, cascade policies, temporal
  versioning, scenario branching, IaC generation, and pipeline automation.

  This library entry is the agent-consumable summary. For full details read:
  - FK-ENHANCEMENT-COMPLETE-PLAN-2026-02-28.md  (plan, v2.0.0, 1100+ lines)
  - FK-ENHANCEMENT-OPUS-FINDINGS-2026-02-28.md  (Opus 4.6 review, 500+ lines)
  - FK-ENHANCEMENT-RESEARCH-2026-02-28.md       (arXiv research, 2100+ lines)
  - FK-ENHANCEMENT-BENEFIT-2026-02-28.md        (51-ACA impact, 300 lines)

--------------------------------------------------------------------------------
 CURRENT STATE (Pre-FK)
--------------------------------------------------------------------------------

  How layers are coupled today:
  - String arrays: endpoints.cosmos_reads = ["jobs", "users"]
  - String references: endpoints.service = "eva-brain-api"
  - No referential integrity (can reference non-existent objects)
  - No cascade enforcement (delete breaks downstream silently)
  - O(n) reverse lookups (scan all screens to find which call an endpoint)
  - No versioning (can't query "what did this screen call 3 months ago?")

  31 layers, 4061+ objects in Cosmos DB (ACA production)
  20 edge types defined in graph.py (read-only materialization, no enforcement)

--------------------------------------------------------------------------------
 FK ENHANCEMENT DESIGN
--------------------------------------------------------------------------------

  27 edge types (20 existing + 7 new for CI/CD):

  From Layer          Edge Type           To Layer          Cascade
  -----------------   -----------------   ---------------   --------
  screens             calls               endpoints         RESTRICT
  screens             uses_component      components        RESTRICT
  screens             uses_hook           hooks             RESTRICT
  endpoints           reads               containers        RESTRICT
  endpoints           writes              containers        RESTRICT
  endpoints           implemented_by      services          RESTRICT
  endpoints           gated_by            feature_flags     SET_NULL
  endpoints           reads_schema        schemas           RESTRICT
  endpoints           writes_schema       schemas           RESTRICT
  hooks               hook_calls          endpoints         RESTRICT
  services            depends_on          services          RESTRICT
  agents              agent_reads         endpoints         RESTRICT
  agents              agent_outputs       screens           RESTRICT
  endpoints           satisfies           requirements      NO_ACTION
  wbs                 wbs_depends         wbs               RESTRICT
  wbs                 wbs_runbook         runbooks          SET_NULL
  projects            project_depends     projects          RESTRICT
  projects            project_wbs         wbs               CASCADE
  personas            persona_flags       feature_flags     SET_NULL
  runbooks            runbook_skill       cp_skills         RESTRICT
  infrastructure      deployed_to (NEW)   environments      RESTRICT
  infrastructure      owned_by (NEW)      projects          CASCADE
  projects            targets_milestone   milestones        SET_NULL
  sprints             has_story (NEW)     wbs               RESTRICT
  cp_workflows        workflow_impl (NEW) runbooks          RESTRICT
  cp_workflows        workflow_tgt (NEW)  environments      RESTRICT
  projects            uses_plane (NEW)    planes            RESTRICT

  CASCADE POLICIES:
  - RESTRICT:   Block delete if children exist (most relationships)
  - CASCADE:    Auto-delete children (project -> wbs tree)
  - SET_NULL:   Nullify FK in children (soft degradation for flags/milestones)
  - NO_ACTION:  Allow delete, leave dangling (admin override, requirements)

--------------------------------------------------------------------------------
 OPUS 4.6 REVIEW VERDICT: CONDITIONAL GO
--------------------------------------------------------------------------------

  4 CRITICAL FLAWS (all fixed in plan v2.0.0):

  CRIT-1  Effort 2-2.5x underestimated
          Was: 180h, 6 sprints. Now: 403h, 12 sprints.
          Phase 1B conflated 5 subsystems into 30h.

  CRIT-2  "Atomic scenario merge" impossible on Cosmos NoSQL
          No cross-partition transactions. Fix: saga pattern with
          compensation log, layer-by-layer merge in topological order.

  CRIT-3  Embedded _relationships creates version conflicts
          Multiple agents updating FKs on same object = contention.
          Fix: Option A (separate /relationships container, +$25/mo)
          or Option C (optimistic retry, acceptable for Phase 0/1A).

  CRIT-4  Missing cycle detection in BFS code
          Queue used (rel_type, child_id) but destructured as (layer, id).
          Fix: visited set with f"{layer}:{id}" keys, deque for O(1) pop.

  3 TOP RECOMMENDATIONS:

  REC-1   Add Phase 0 NOW (48h): Server-side string-array validation
          using existing EDGE_TYPES. Zero migration risk, 60% of value.

  REC-2   Split Phase 1B into 5 independent phases:
          1B-Scenarios, 1C-IaC, 1D-Pipelines, 1E-Workflows, 1F-Snapshots.

  REC-3   Budget 403 hours, not 180. Track velocity per sprint.

--------------------------------------------------------------------------------
 IMPLEMENTATION PHASES (12 Sprints, March 2026 - February 2027)
--------------------------------------------------------------------------------

  Phase     Sprint   Month      Hours  Deliverables
  --------  ------   ---------  -----  -------------------------------------------
  Phase 0   S1-S2    Mar-Apr     48    FK validation on string arrays, orphan scan
  Phase 1A  S3-S4    May-Jun     80    RelationshipMeta schema, 100+ unit tests
  Phase 1B  S5-S6    Jul         40    Scenario CRUD, saga merge
  Phase 2   S6       Jul         15    Seed FKs for pilot (337 objects)
  Phase 3   S7       Aug         35    O(1) indexes, BFS cycle detection
  Phase 1C  S8       Sep         30    IaC generation (Bicep + Terraform)
  Phase 1D  S9       Oct         30    Pipeline generation (ADO + GitHub Actions)
  Phase 4   S10      Nov         35    Cascade rules, delete safety
  Phase 1E  S10      Nov         25    Workflow orchestration + scheduling
  Phase 1F  S11      Dec         20    Snapshots (create/restore/rollback)
  Phase 5   S12      Jan-Feb     45    Full migration (4061+ objects)
  ---                           ---
  TOTAL                         403

  KEY MILESTONES:
  M0  Apr 2026   Phase 0 ship -- FK validation live, zero migration risk
  M1  Jun 2026   Phase 1A ship -- RelationshipMeta, 100+ tests
  M2  Aug 2026   Scenario MVP -- saga merge working
  M3  Aug 2026   Navigation live -- O(1) children/parents/descendants
  M6  Feb 2027   Full migration -- all objects FK-only, 200+ tests

--------------------------------------------------------------------------------
 PHASE 0 -- IMMEDIATE START (Zero Risk, 60% of Value)
--------------------------------------------------------------------------------

  Phase 0 delivers server-side FK validation using the EXISTING EDGE_TYPES
  registry WITHOUT any schema migration, new containers, or _relationships
  field. It validates that string references point to real objects at write time.

  3 code changes:
  1. Extend EDGE_TYPES dict with cascade + required metadata (graph.py)
  2. Add validate_fks() to AbstractStore, wire into upsert() (base.py)
  3. Add GET /model/relationships/orphans endpoint (graph.py)

  What Phase 0 catches (examples):
  - endpoints.service = "nonexistent-service"  -> FK validation error
  - screens.api_calls = ["deleted-endpoint"]   -> FK validation error
  - endpoints.feature_flag = "removed-flag"    -> FK validation error

  What Phase 0 does NOT do:
  - No _relationships field (that's Phase 1A)
  - No scenario branching (that's Phase 1B)
  - No cascade enforcement (that's Phase 4)
  - No IaC/pipeline generation (that's Phase 1C/1D)

--------------------------------------------------------------------------------
 RISK MATRIX (14 Risks)
--------------------------------------------------------------------------------

  #    Risk                                    P      I      Mitigation
  ---  --------------------------------------  -----  -----  -------------------------
  R1   Circular deps break migration           MED    HIGH   Phase 0 scan + CRIT-4 fix
  R2   Orphan refs cause validation errors     HIGH   MED    Phase 0 orphan endpoint
  R3   Performance regression                  LOW    MED    Async validation, caching
  R4   Port 8055 isolation breaks              LOW    HIGH   Independent MODEL_DIR
  R5   51-ACA pilot blocked                    MED    LOW    Opt-in, backward compat
  R6   Cosmos migration fails                  LOW    CRIT   Snapshot + rollback script
  R7   Cross-partition merge failure           HIGH   CRIT   Saga pattern (CRIT-2)
  R8   Hot-object FK contention                MED    HIGH   Separate container (CRIT-3)
  R9   BFS infinite loop on cycles             MED    HIGH   layer:id visited set
  R10  Phase 1B scope creep                    HIGH   HIGH   Split into 5 phases
  R11  Effort underestimate / burnout          HIGH   CRIT   Budget 403h, track velocity
  R12  Invalid IaC output                      MED    MED    PSRule validation gate
  R13  Saga compensation failure               LOW    CRIT   Idempotent compensation
  R14  Snapshot storage unbounded              LOW    MED    TTL policy, max 10 active

--------------------------------------------------------------------------------
 KEY API ROUTES (POST-FK)
--------------------------------------------------------------------------------

  EXISTING (enhanced with FK validation):
  PUT  /model/{layer}/{id}                    # Now validates FK integrity
  GET  /model/graph?node_id=X&depth=2         # Already works (20 edge types)

  PHASE 0 (new):
  GET  /model/relationships/orphans           # Scan for dangling FK references

  PHASE 1A (new):
  POST /model/relationships/validate          # Pre-flight FK check

  PHASE 1B (new -- saga-based merge):
  POST /model/scenarios/create
  POST /model/scenarios/{id}/merge            # Saga pattern, NOT atomic

  PHASE 3 (new -- O(1) navigation):
  GET  /model/{layer}/{id}/children           # Forward FK lookup
  GET  /model/{layer}/{id}/parents            # Reverse FK lookup
  GET  /model/{layer}/{id}/descendants        # BFS with cycle detection

  PHASE 1C/1D (new -- generation):
  GET  /model/iac/generate?format=bicep       # FK graph -> Bicep/Terraform
  GET  /model/pipelines/generate              # FK graph -> Azure Pipelines YAML

  PHASE 4 (new -- cascade):
  DELETE /model/{layer}/{id}                  # Cascade-aware delete

  PHASE 1F (new -- snapshots):
  POST /model/snapshots/create                # Point-in-time FK state
  POST /model/snapshots/{id}/restore          # Rollback

--------------------------------------------------------------------------------
 AGENT QUICK REFERENCE
--------------------------------------------------------------------------------

  Q: When does FK validation start?
  A: Phase 0 (March 2026). All upserts will validate string-array FK refs.

  Q: When can I use scenario branching?
  A: Phase 1B (July 2026). Saga-based merge (not atomic).

  Q: When can I generate Bicep from the model?
  A: Phase 1C (September 2026). Depends on Phase 3 indexes.

  Q: Is the migration breaking?
  A: No. String arrays remain during 6-month transition (Phase 5 -> +6 months).

  Q: What about Cosmos performance?
  A: Phase 0 adds ~1 read per FK field per upsert. Negligible at current scale.
     Phase 3 indexes are in-memory (rebuilt on startup). < 100ms queries.

  Q: How many tests?
  A: Phase 0: 60+, Phase 1A: 100+, Phase 3: 50+, Phase 4: 30+ = 200+ total.

  Q: What's the Opus 4.6 verdict?
  A: CONDITIONAL GO. 4 critical flaws fixed. Core design is sound.

================================================================================
