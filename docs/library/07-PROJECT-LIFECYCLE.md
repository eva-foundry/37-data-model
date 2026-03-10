================================================================================
 EVA PROJECT LIFECYCLE
 File: docs/library/07-PROJECT-LIFECYCLE.md
 Updated: 2026-02-24 @ 15:45 ET -- Azure MAF orchestration layer added; sprint workplan defined
 Scope: Every numbered project under C:\eva-foundry\eva-foundation\
================================================================================

This document describes the complete lifecycle of any EVA project, from the
first idea through to verified delivery recorded in the evidence plane.

It is the authoritative reference for the question: "how does work actually
happen here?"

--------------------------------------------------------------------------------
 OVERVIEW: 6 PHASES
--------------------------------------------------------------------------------

  PHASE 0   IDEATION      Idea -> numbered folder + identity
  PHASE 1   BOOTSTRAP     Governance docs created + legacy absorbed
  PHASE 2   DECOMPOSE     Docs become WBS -> Epics -> Features -> Stories
  PHASE 3   REGISTER      Artifacts pushed to GitHub + loaded into data model
  PHASE 4   EXECUTE       Sprint started, DPDCA workflow runs, evidence collected
  PHASE 5   VERIFY        eva-veritas scores truth, ADO closes, evidence packed

  Full cycle (happy path): idea to first evidence record = 1-3 sprints.
  Orchestration bridge: ADO approval -> MAF -> GitHub Actions -> MAF -> ADO.

--------------------------------------------------------------------------------
 PHASE 0 -- IDEATION
--------------------------------------------------------------------------------

  Input:  An idea, a gap, a request, or an REQ-xxx backlog item in data model.
  Output: Numbered project folder under C:\eva-foundry\eva-foundation\

  DECISION
  --------
  Is this a change to an existing project OR a new capability?

  Existing project -> PUT status on the requirement -> ADO PBI via 38-ado-poc.
  New capability   -> assign next number -> create folder -> proceed to Phase 1.

  FOLDER CONVENTION
  -----------------
  C:\eva-foundry\eva-foundation\{NN}-{slug}\
    NNs are sequential integers, two-digit minimum (01, 02 ... 48, 49 ...)
    slug is kebab-case, concise (e.g. eva-veritas, cds-rag, jp-rebuild)

  DATA MODEL REGISTRATION
  -----------------------
  Every numbered project is an object in the `projects` layer (48 entries).
  Fields: id, name, maturity, description, owner, repo_path, copilot_instructions
  Maturity values: idea -> poc -> active -> retired

  Register immediately:
    PUT http://localhost:8010/model/projects/{NN}-{slug}
      { maturity: "idea", description: "...", ... }
    POST http://localhost:8010/model/admin/commit

  The project now has a row_version and an immutable audit trail from day 1.

--------------------------------------------------------------------------------
 PHASE 1 -- BOOTSTRAP
--------------------------------------------------------------------------------

  Input:  Empty numbered folder.
  Output: Governance docs committed. Copilot context loaded. WBS seed ready.

  STEP 1-A  GOVERNANCE DOCUMENT CREATION
  ----------------------------------------
  Create in this order (each doc feeds the next):

    README.md     -- What is this project?
                     One paragraph. Problem statement. What it does. What it
                     does NOT do. Maturity. Owner.
                     Paste in the arch diagram stub (ASCII).

    PLAN.md       -- How will we build it?
                     Feature list + story list with IDs (FEAT-01, STORY-01-001).
                     Each story has: acceptance criteria, depends_on.
                     Use EVA-STORY: <ID> comment in every source file header
                     so eva-veritas can link artifacts to stories.

    STATUS.md     -- Where are we now?
                     Table: Feature ID | Status | Sprint | Notes.
                     Uses EVA-STORY convention for consistency scoring.
                     Updated by the agent after every sprint execution.

    ACCEPTANCE.md -- What does "done" mean?
                     Top-level done criteria (plain language).
                     One section per Feature, with testable checklist.
                     Sign-off table: technical, product, security.

  STEP 1-B  LEGACY DOCUMENT INGESTION
  -------------------------------------
  For projects that have prior art (papers, specs, old READMEs, findings):

    1. Place documents in docs/ (no renaming, preserve original filenames)
    2. Add a docs/LEGACY-INDEX.md: one line per document with:
         - original source
         - what it contributed to this project
         - whether it is still authoritative or superseded
    3. Key insights extracted into PLAN.md (become stories)
    4. Key constraints extracted into ACCEPTANCE.md (become done criteria)

  For 19-ai-gov: The Agentic State paper, EVA-State-Paper.md, MTI spec,
  Actor Governance, Decision Engine spec -- all in docs/, all indexed.
  The paper is the RATIONALE for the entire EVA programme.

  STEP 1-C  COPILOT INSTRUCTIONS
  --------------------------------
  Copy from 07-foundation-layer template:
    C:\eva-foundry\eva-foundation\07-foundation-layer\02-design\artifact-templates\
      copilot-instructions-template.md

  Place at: .github/copilot-instructions.md

  Fill in PART 2 (project-specific):
    - Stack
    - Test commands
    - Patterns and conventions
    - Skills directory if > 0 skills exist

  STEP 1-D  SKILLS SEED (if applicable)
  ---------------------------------------
  If the project needs reusable automation beyond basic DPDCA:
    .github/copilot-skills\00-skill-index.skill.md  (index)

  Skills are mastered in 29-foundry and SOURCED to project repos.
  Never write a new skill directly in the project repo -- write it in 29-foundry,
  test it there, then reference it from here.

  STEP 1-E  ADO ARTIFACT MANIFEST
  ---------------------------------
  Create ado-artifacts.json at project root.
  This is the bridge from repo docs to ADO work items.

  Minimum structure (38-ado-poc/ado-artifacts.json is the reference):
    {
      "epic":         { title, description, tags, area_path },
      "features":     [ { id_hint, title, description, tags } ],
      "user_stories": [ { id_hint, title, acceptance_criteria, tags } ]
    }

  ADO import (Phase 3) reads this file.

--------------------------------------------------------------------------------
 PHASE 2 -- DECOMPOSE (docs become WBS + Agile hierarchy)
--------------------------------------------------------------------------------

  Input:  README + PLAN + STATUS + ACCEPTANCE (+ legacy docs)
  Output: WBS entries in data model. Epics/Features/Stories in ADO.

  The governance documents ARE the WBS. They are not separate artifacts.
  README = deliverable intent.
  PLAN = work breakdown (features = work packages, stories = work items).
  ACCEPTANCE = phase gate criteria (done criteria on WBS entries).

  DECOMPOSITION MAP
  -----------------

  DOCUMENT SECTION              WBS / AGILE ARTIFACT
  -------------------------     -------------------------------------------
  README one-paragraph          WBS node (project level under stream)
    "What it does"              deliverable field on WBS
    "What it does NOT do"       out_of_scope / negative criteria

  PLAN feature list             Epic (ADO) + requirements layer (data model)
    Feature title + description   Epic title + Feature PBI
    Feature done criteria         Epic acceptance criteria
    Depends_on references         Epic dependency links

  PLAN story list               Feature PBIs (ADO) + requirements layer
    Story ID (STORY-01-001)       PBI title
    Story acceptance criteria     Acceptance criteria field
    Story depends_on              Parent/blocks linking

  ACCEPTANCE top-level          WBS done_criteria field
    Feature checklists            Feature-level acceptance criteria
    Sign-off table                Phase gate approvers

  CONVENTION
  ----------
  Every story ID in PLAN.md MUST match the format the project uses as its
  EVA-STORY tag in source files. This enables eva-veritas to cross-reference.

  Example tag in a source file:
    // EVA-STORY: STORY-01-001
    // EVA-FEATURE: FEAT-01

  WBS REGISTRATION (data model)
  ------------------------------
  For every project:
    1. GET http://localhost:8010/model/wbs/
    2. Find the parent stream (WBS-S-UP, WBS-S-AI, WBS-S-PL, WBS-S-DEV, etc.)
    3. PUT http://localhost:8010/model/wbs/WBS-P-{NN}
         { label, level:"project", parent_wbs_id, deliverable, done_criteria,
           ado_epic_id: null (filled after Phase 3),
           project_id: "{NN}-{slug}" }
    4. PUT requirements for each epic/feature/story (type field distinguishes)
    5. POST http://localhost:8010/model/admin/commit

  REQUIREMENTS LAYER CONVENTION
  ------------------------------
  id format:   EPIC-{NNN}      for epics
               FEAT-{NNN}      for features (future layer or notes field)
               STORY-{P}-{NNN} for stories (P = project number, NNN = seq)
               REQ-{NNN}-{tag} for cross-cutting requirements (backlog proposals)
  project:     "{NN}-{slug}"  (scope owner -- enables GET filter by project)
  type:        capability | epic | feature | story | pbi | proposal
  status:      proposed -> planned -> in-progress -> done | blocked
  ado_wi_id:   null until 38-ado-poc writes it back after import

--------------------------------------------------------------------------------
 PHASE 3 -- REGISTER (GitHub push + data model load)
--------------------------------------------------------------------------------

  Input:  All governance docs + ado-artifacts.json + data model entries PUT.
  Output: Repo live on GitHub. ADO board populated. Data model committed.

  STEP 3-A  GITHUB COMMIT AND PUSH
  ----------------------------------
    git init (if new)
    git add .
    git commit -m "feat: bootstrap -- README PLAN STATUS ACCEPTANCE [WBS-P-{NN}]"
    git remote add origin https://github.com/eva-foundry/{NN}-{slug}.git
    git push -u origin main

  STEP 3-B  ADO IMPORT (38-ado-poc)
  -----------------------------------
  38-ado-poc reads ado-artifacts.json and imports to ADO.
  Script: C:\eva-foundry\eva-foundation\38-ado-poc\ado-import.ps1

    cd C:\eva-foundry\eva-foundation\{NN}-{slug}
    C:\eva-foundry\eva-foundation\38-ado-poc\ado-import.ps1 -ArtifactsFile .\ado-artifacts.json

  After import:
    - Note the ADO Epic ID returned
    - PUT the data model WBS entry with the real ado_epic_id
    - PUT each requirements entry with ado_wi_id from ADO response
    - POST /model/admin/commit  (close the write cycle)

  This is the READBACK step -- data model and ADO stay in sync.

  STEP 3-C  FULL DATA MODEL COMMIT
  ----------------------------------
  All layers must be clean before sprint execution begins.
  Check: POST http://localhost:8010/model/admin/commit
    -> response.status must be "PASS"
    -> response.violation_count must be 0

  If violations: fix cross-reference FAILs before proceeding.
  38+ repo_line WARNs are pre-existing noise -- not caused by your work.

  STATE AFTER PHASE 3
  --------------------
    GitHub:     project repo live, docs committed
    ADO:        Epic + Features + PBIs created, sprint backlog populated
    Data model: WBS + requirements registered, ado_wi_id fields populated
    eva-veritas: can run `eva discover` against the repo (finds docs, 0 artifacts)

--------------------------------------------------------------------------------
 PHASE 4 -- EXECUTE (sprint start -> DPDCA -> evidence)
--------------------------------------------------------------------------------

  This is the runtime phase. It executes on a per-sprint basis.
  Architecture: ADO = approval plane. GitHub = execution plane.
                Azure MAF = orchestration bridge. No direct ADO<->GitHub coupling.

  ASCII FLOW
  ----------

  HUMAN: approves sprint in ADO Environment gate
         |
         v
  ADO PIPELINE (38-ado-poc / azure-pipelines.yml)
  Stage 1: SprintGate      -- human approval in ADO Environment gate
  Stage 2: Bootstrap       -- pull WI context from ADO REST API
                              -> wi-context.json pipeline artifact
  Stage 3: Dispatch        -- POST to Azure MAF Orchestration agent
                              body: { wi_context_url, project_repo, sprint,
                                      skill_version, ado_pipeline_build_id }
  Stage 4: Monitor         -- await MAF completion event (webhook / callback)
                              -> on success: mark ADO pipeline Done
                              -> on failure: mark Failed + Teams alert
         |
         v
  AZURE MAF ORCHESTRATION (Microsoft Agent Framework)
  Task: trigger-github     -- POST workflow_dispatch to eva-foundry/{NN}-{slug}
                              body: { wi_context_url, sprint, skill_version }
                              -> captures GH Actions run_id
  Task: monitor-run        -- poll GET /repos/.../actions/runs/{run_id}
                              interval: every 15 min while status=in_progress
                              timeout: 6 hours (configurable)
  Task: relay-heartbeats   -- forward GH step summary heartbeats to
                              ADO WI comment (structured JSON pass-through)
  Task: completion-signal  -- on GH conclusion: POST callback to ADO Stage 4
                              body: { run_id, pr_url, mti_score, conclusion,
                                      gh_commit_sha, stories_done }
         |
         v
  GITHUB ACTIONS (.github/workflows/sprint-execute.yml on PROJECT REPO)
  Job: planner             -- download wi-context.json from ADO artifact URL
                              read sprint-workplan.json (execution template)
                              resolve skill versions from 29-foundry catalog
                              build DPDCA execution plan -> plan.json
         |
         v
         v
  Job: dpdca-discovery     -- D: scan current repo state
                              GET /model/{layers} for project context
                              run eva discover (48-eva-veritas)
                              output: discovery.json (what exists vs what planned)
         |
         v
  Job: dpdca-plan          -- P: reconcile gaps from discovery
                              pull foundry skills matching WI tags
                              build per-story task list
                              output: execution-plan.json
         |
         v
  Job: dpdca-do            -- D: execute tasks
                              call Foundry skill endpoints (29-foundry MCP)
                              write code / docs / config as specified by tasks
                              tag all new files with EVA-STORY comments
          |
          | [heartbeat every N minutes -> ADO Pipeline WI comment]
          | POST https://dev.azure.com/.../workItems/{id}/comments
          |   body: "[HEARTBEAT] {step} -- {status} -- {timestamp}"
          |
         v
  Job: dpdca-check         -- C: validate evidence
                              run tests (jest / pytest / playwright)
                              run eva reconcile (48-eva-veritas)
                              compute MTI: must be >= 70 to pass gate
                              PUT data model with updated status fields
                              output: evidence-pack/ (test results, logs, MTI)
         |
         v
  Job: dpdca-act           -- A: correct, document, signal
                              if failures in check: patch + re-run check
                              update STATUS.md (story statuses)
                              POST /model/admin/commit (close write cycle)
                              create PR with evidence-pack/ as artifacts
         |
         v
  PR CREATED (with evidence)
    PR body:     WI ID, sprint, MTI score, stories completed, test summary
    Artifacts:   evidence-pack/ (tests, logs, reconciliation.json, trust.json)
    Labels:      sprint-{N}, wi-{ID}, mtI-{score}
         |
         v
  COMPLETION SIGNAL -> ADO
    POST https://dev.azure.com/.../workItems/{id}
      { "state": "Done", "fields": {
          "System.History": "[DONE] GH run={run_id} PR={pr_url} MTI={score}"
      }}
    ADO Pipeline Stage 4 (Monitor) detects conclusion=success -> marks Done

  HEARTBEAT DETAIL
  ----------------
  Sent from dpdca-do job at:
    - Job start
    - Every task group completed (e.g. "3/7 stories implemented")
    - Any blocking error encountered
    - Job finish

  Format: "[HEARTBEAT] {phase} {stories_done}/{stories_total} MTI-preview:{n}"
  Destination: ADO WI comment (via ADO REST API) + GitHub step summary

  SKILLS RESOLUTION
  ------------------
  dpdca-plan resolves skills from 29-foundry:
    1. Read WI tags from wi-context.json
    2. GET http://localhost:8010/model/mcp_servers/  (list available servers)
    3. Match tags to skill catalog (29-foundry/skill-catalog.json)
    4. Pull skill version pinned in ado-artifacts.json:skill_version
    5. Execute skills in order defined by execution-plan.json

  Skills are NEVER written in the project repo.
  Skills ARE mastered in 29-foundry, versioned, tested independently.
  The project runner is a consumer of skills, not a skill author.

  SPRINT WORKPLAN (sprint-workplan.json)
  ----------------------------------------
  Every project repo contains a sprint-workplan.json that describes what
  the planner job should do for a given feature/sprint combination.
  It is the execution template -- the DPDCA engine reads it.

  Minimal structure:
    {
      "schema_version": "1.0",
      "project": "{NN}-{slug}",
      "supported_features": ["FEAT-01", "FEAT-02"],
      "skill_tags": ["frontend", "api", "test"],
      "dpdca_steps": {
        "discovery": { "run_veritas": true, "scan_model": true },
        "plan":      { "skill_match": "tags", "foundry_catalog": true },
        "do":        { "write_code": true, "tag_files": true },
        "check":     { "run_tests": true, "mti_threshold": 70,
                       "update_model": true },
        "act":       { "update_status": true, "commit_model": true,
                       "create_pr": true }
      },
      "heartbeat_interval_steps": 10,
      "evidence_pack_path": ".eva/",
      "completion_payload": [
        "run_id", "pr_url", "mti_score", "gh_commit_sha", "stories_done"
      ]
    }

  The planner builds a concrete execution-plan.json from:
    - sprint-workplan.json  (template)
    - wi-context.json       (WI to execute, acceptance criteria, skill_version)
    - 29-foundry skill catalog (skills matched to tags)
    - GET /model/requirements/?project={NN}-{slug} (story list)
    - GET /model/endpoints/?service={service}      (API endpoints to implement)

  Workplan is committed to the project repo. It is versioned.
  Changing it MUST bump ado-artifacts.json:skill_version.

  COMPLETION SIGNAL (MAF -> ADO)
  --------------------------------
  When dpdca-act creates the PR:
    1. PR body includes: WI ID, sprint, MTI score, stories done, GH run ID
    2. GitHub step summary posts completion JSON to a pre-agreed MAF callback URL
       (configured in sprint-workplan.json: completion_callback_url)
    3. MAF Task: completion-signal reads the callback JSON and:
       a. Extracts { run_id, pr_url, mti_score, gh_commit_sha, stories_done }
       b. POSTs ADO WI state update: State=Done, comment=[DONE] block
       c. Fires ADO Stage 4 pipeline completion webhook
    4. ADO Stage 4 (Monitor) receives the event, marks pipeline as succeeded
    5. ADO automatically transitions WI to Closed at sprint review ceremony

  ADO CONTEXT PASSED TO GITHUB
  -----------------------------
  wi-context.json (published as ADO artifact, downloaded by sprint-execute.yml):
    {
      "wi_id":          1234,
      "wi_tag":         "WI-7",
      "wi_title":       "Implement EVA Brain v2 router mounting",
      "wi_type":        "Product Backlog Item",
      "feature_title":  "EVA Brain v2 runnable API",
      "feature_id":     5,
      "epic_title":     "33-eva-brain-v2",
      "epic_id":        26,
      "sprint":         "Sprint-2",
      "acceptance_criteria": "...",
      "data_model_endpoint_ids": ["POST /v1/sessions", "GET /v1/sessions"],
      "skill_version":  "1.0.0",
      "ado_pipeline_build_id": "456"
    }

--------------------------------------------------------------------------------
 PHASE 5 -- VERIFY (eva-veritas scores truth, board closes, evidence packed)
--------------------------------------------------------------------------------

  Input:  PR with evidence. Sprint complete signal from GitHub.
  Output: MTI score recorded. ADO board updated. 40-control-plane evidence pack.

  STEP 5-A  eva-veritas FINAL AUDIT (48-eva-veritas)
  ---------------------------------------------------------
  Triggered either by:
    a) dpdca-check job (inline, during execution -- early gate)
    b) Post-merge CI job (final, after PR merged -- audit gate)

    eva discover  --repo {project-path}
    eva reconcile --repo {project-path}
    eva compute-trust --repo {project-path}
    eva report    --repo {project-path}

  Output written to .eva/:
    discovery.json       -- what exists vs planned
    reconciliation.json  -- gaps[], consistency_score, coverage
    trust.json           -- { score, coverage, evidence, consistency, actions[] }

  MTI GATE
  --------
  score >= 90: deploy / merge / release (green)
  score >= 70: test / review / merge-with-approval (yellow)
  score >= 50: review-required / no-deploy (orange)
  score  < 50: BLOCK / investigate (red -- PR cannot be merged)

  Trust score is written back to data model:
    PUT http://localhost:8010/model/requirements/{EPIC-xxx}
      { status: "done", notes: "MTI={score} sprint={N} run={run_id}" }

  STEP 5-B  40-EVA-CONTROL-PLANE EVIDENCE PACK
  ----------------------------------------------
  After PR merge, 40-ctrl-plane records the run:
    runs.json     -- correlationId, actor, intent, WI_id, MTI, duration, cost
    artifacts.json -- PR url, commit SHA, test results path, .eva/ snapshot
    step_runs.json -- per-step timing (for performance analysis)

  This is the immutable audit record.
  The evidence pack is the ATO artifact for this sprint's work.

  STEP 5-C  ADO BOARD FINAL UPDATE
  ----------------------------------
  dpdca-act sends the final WI state:
    State:   Done
    Comment: "[DONE] GH run={run_id} PR={pr_url} MTI={score}
              Stories: {N}/{N} done. Evidence: {artifact_url}"

  ADO Pipeline Stage 4 (Monitor) detects conclusion -> marks Done.
  ADO automatically moves WI to Closed at sprint review.

  STEP 5-D  DATA MODEL CYCLE CLOSE
  ----------------------------------
  Final PUT for all requirements touched this sprint:
    status: "done"
    notes:  sprint reference + MTI + PR
    ado_wi_id: confirmed (or written if null)
  POST /model/admin/commit -> must return PASS, violations=0.

  STATUS.md UPDATE
  ----------------
  The dpdca-act job updates the project's STATUS.md with the final
  story statuses before creating the PR:
    STORY {ID}: Done  (sets status for eva-veritas consistency scoring)
    FEATURE {ID}: Done  (when all stories in feature complete)

--------------------------------------------------------------------------------
 FULL LIFECYCLE: ASCII TIMELINE
--------------------------------------------------------------------------------

  IDEATION
  --------
  [Idea / Gap]
       |
       v
  [Data model: PUT projects/{NN} maturity=idea]
       |
       v
  [Numbered folder created: {NN}-{slug}/]

  BOOTSTRAP
  ---------
  [README.md] -> [PLAN.md] -> [STATUS.md] -> [ACCEPTANCE.md]
                                   |
                          [legacy docs ingested]
                          [docs/LEGACY-INDEX.md]
                                   |
                          [ado-artifacts.json created]
                          [.github/copilot-instructions.md]
                          [ skills seeded if needed ]

  DECOMPOSE
  ---------
  [PLAN features] -----> [requirements layer: EPIC-xxx, FEAT-xxx, STORY-xxx]
  [README]        -----> [wbs layer: WBS-P-{NN}]
  [ACCEPTANCE]    -----> [done_criteria on WBS + requirements]

  REGISTER
  --------
  [git push origin main]
       |
       v
  [38-ado-poc: ado-import.ps1]               [model admin/commit -> PASS]
       |                                              |
       v                                              v
  [ADO: Epic + Features + PBIs created]    [Cosmos DB: all layers synced]
       |                                              |
       v                                              v
  [PUT ado_epic_id, ado_wi_id back to data model]
  [admin/commit -> PASS, violations=0]

  EXECUTE (per sprint, repeats)
  --------
  [Human approves sprint in ADO gate]
       |
       v
  [ADO Pipeline: SprintGate -> Bootstrap -> Dispatch(to MAF)] -> [Monitor]
       |
       v
  [Azure MAF: trigger-github / monitor-run / relay-heartbeats / completion-signal]
       |
       v
  [GitHub Actions: sprint-execute.yml]
  [Planner: sprint-workplan.json + wi-context + foundry skills + model context]
       |
       v
  [DPDCA: Discovery -> Plan -> Do -> Check -> Act]
       |
       | <-- heartbeats via MAF to ADO WI comment every N steps
       |
       v
  [Evidence collected: tests + reconciliation + MTI score (.eva/)]
       |
       v
  [PR created with evidence-pack/ artifacts]
       |
       v
  [Completion signal: MAF -> ADO] { run_id, pr_url, mti_score, gh_commit_sha }

  VERIFY
  ------
  [eva-veritas: eva discover + reconcile + compute-trust + report]
       |
       v
  [.eva/trust.json: { score, actions[] }]
  MTI >= 70? --YES--> [PR merge approved]
  MTI  < 50? --NO---> [PR BLOCKED, investigate]
       |
       v
  [40-eva-control-plane: run record + evidence pack]
       |
       v
  [Data model: requirements status=done, admin/commit PASS]
       |
       v
  [ADO: WI Closed, sprint review, next sprint planned]

--------------------------------------------------------------------------------
 THE AUTHORITY TABLE (who owns what)
--------------------------------------------------------------------------------

  PLANE            SYSTEM              WHAT IT OWNS
  ---------------  ------------------  ------------------------------------------
  Declaration      37-data-model       What SHOULD exist.
  (Data Plane)     port 8010, Cosmos   Projects, endpoints, screens, requirements,
                                       WBS, services, agents, personas.
                                       The blueprint. PUT via API only.

  Execution        ADO (eva-poc)       What work is IN FLIGHT.
  (Work Plane)     dev.azure.com       Epics, Features, PBIs, Sprints, state.
                                       Single source of truth for sprint state.
                                       Loaded by 38-ado-poc from ado-artifacts.json.
                                       Receives completion signal from MAF.

  Dispatch         38-ado-poc          Sprint approval gate + WI bootstrap.
  (Approval Plane) ADO Pipelines       Pulls wi-context.json. Triggers MAF.
                                       Awaits MAF completion callback.
                                       Closes WI to Done after signal received.

  Orchestration    Azure MAF           The bridge: ADO approval -> GitHub -> ADO.
  (Agent Plane)    Microsoft Agent     Receives dispatch from 38-ado-poc pipeline.
                   Framework           Triggers GitHub Actions workflow_dispatch.
                                       Monitors GH Actions run (poll/event).
                                       Relays heartbeats to ADO WI comments.
                                       Sends completion signal (run_id, pr_url,
                                       mti_score, gh_commit_sha) back to ADO.
                                       Handles retries + timeout escalation.
                                       Hosted: 29-foundry orchestration plane.

  Evidence         GitHub (+Actions)   Where work HAPPENS.
  (Code Plane)     eva-foundry/*       Source code, CI runs, PRs, commits.
                                       sprint-execute.yml = execution entry.
                                       sprint-workplan.json = DPDCA template.
                                       .eva/ holds veritas output per repo.

  Verification     48-eva-veritas      What ACTUALLY EXISTS (verified).
  (Evidence Plane) Node.js CLI         discover + reconcile + compute-trust.
                                       MTI score gates merge and deploy.
                                       Hosted as MCP server in 29-foundry.

  Runtime          40-eva-ctrl-plane   What RAN (immutable record).
  (Control Plane)  port 8020, ACA      Run records, evidence packs, deploy audit.
                                       ATO artifact. PIPEDA audit lane input.

  Skills           29-foundry          How work gets done.
  (Capability Hub) MCP servers         Reusable, versioned, tested skills.
                                       Multi-agent orchestrator, RAG, eval.
                                       Hosts MAF orchestration agent.
                                       NEVER write skills in project repos.

--------------------------------------------------------------------------------
 NAMING AND ID CONVENTIONS (summary)
--------------------------------------------------------------------------------

  Project folder:  {NN}-{slug}              e.g. 48-eva-veritas
  WBS node:        WBS-P-{NN}               e.g. WBS-P-48
  WBS stream:      WBS-S-{stream}           e.g. WBS-S-AI
  Epic (model):    EPIC-{NNN}               e.g. EPIC-015
  Feature (model): FEAT-{NNN}               e.g. FEAT-048-001
  Story (model):   STORY-{NN}-{NNN}         e.g. STORY-48-001
  Requirement:     REQ-{NNN}-{tag}          e.g. REQ-037-E09
  Source tag:      // EVA-STORY: STORY-48-001
  Sprint WI tag:   WI-{N}                   e.g. WI-7 (ADO WI ID reference)
  Evidence file:   .eva/trust.json          per repo, per eva-veritas run
  Run record:      correlationId in 40      UUID, tied to WI + sprint

--------------------------------------------------------------------------------
 NOTES FOR AGENTS
--------------------------------------------------------------------------------

  0. THE JSON FILES DO NOT EXIST FOR YOU.
     model/*.json are an internal implementation detail of the API server.
     Agents must never read, grep, parse, or reference them.
     Bootstrap with HTTP:
       GET /health                -> confirms store + hints at agent_guide URL
       GET /model/agent-guide     -> complete protocol in structured JSON
       GET /model/agent-summary   -> all 27 layer counts in one call
     The API self-documents. Read it first.

  1. READ THE WI CONTEXT FIRST.
     Every sprint-execute.yml job MUST download wi-context.json before doing
     anything else. It contains the WI ID, acceptance criteria, skill version,
     and data model endpoint IDs. Do not guess these values.

  2. READ THE SPEC, NOT THE CODE.
     For any component or screen: read eva-jp-rebuild-spec.json or the
     equivalent project spec file before touching source. Never guess props,
     i18n keys, or ARIA attributes.

  3. DATA MODEL WRITES GO THROUGH THE API. ALWAYS.
     PUT /model/{layer}/{id} -> GET to verify row_version+1 -> POST admin/commit.
     admin/commit must return PASS + violations=0 before the sprint is done.
     Direct file edits bypass row_version and the audit trail.

  4. SKILLS COME FROM 29-FOUNDRY.
     If you need a skill that doesn't exist, register it in 29-foundry first,
     test it there, version it, then reference it from the project runner.

  5. HEARTBEATS ARE MANDATORY DURING DO PHASE.
     Every 10-15 work units (or minutes), post a heartbeat to the ADO WI comment.
     This is the only window into async execution for the human sprint owner.

  6. EVA-VERITAS IS THE TRUTH GATE.
     MTI < 50 = PR is blocked. The score is not negotiable.
     Fix the gaps (add EVA-STORY tags, write the missing tests, update STATUS.md)
     then re-run compute-trust.

================================================================================
