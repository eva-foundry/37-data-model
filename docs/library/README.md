================================================================================
 EVA DATA MODEL LIBRARY -- INDEX
 File: docs/library/README.md
 Updated: 2026-02-24 @ 15:45 ET -- 07: Azure MAF + sprint workplan; 34 services
================================================================================

This library captures the full current state of the EVA ecosystem.
It is the context document set for all future Copilot sessions.
Read 00-EVA-OVERVIEW.md first, then follow the chain.

No Mermaid. No emoji. ASCII only. Printable.

--------------------------------------------------------------------------------
 FILE INDEX
--------------------------------------------------------------------------------

  File                          What it covers
  ----------------------------  -----------------------------------------------
  00-EVA-OVERVIEW.md            Master orientation. What EVA is, the 48-project
                                ecosystem, Azure infra, 5 design principles,
                                data model snapshot, key files to read next.

  01-AGENTIC-STATE.md           "The Agentic State" Berlin paper (Oct 9, 2025).
                                Core thesis, 12-layer framework, full EVA<->
                                paper mapping, what the paper doesn't cover
                                (and EVA does), the EVA State Paper opportunity.

  02-ARCHITECTURE.md            ASCII system architecture. 8 diagrams:
                                (1) Full system landscape
                                (2) Governance enforcement path
                                (3) Persona-driven navigation
                                (4) EVA DA chat RAG happy path
                                (5) Two logging lanes (PIPEDA + structural)
                                (6) FinOps attribution model
                                (7) eva-veritas three-plane model (48)
                                (8) Two-portal split: assistant-face (20) vs
                                    ops-face (26) -- face field in Cosmos.

  03-DATA-MODEL-REFERENCE.md    All 27 layers with counts, notes, key fields.
                                Write cycle protocol. Query reference (what API
                                call to make instead of grepping files).
                                Validation rules for PASS 0 violations.

  04-PORTAL-SCREENS.md          All 46 screens by face (assistant-face / ops-face).
                                TWO-PORTAL SPLIT ratified 2026-02-24.
                                assistant-face (20): Auth, EVA DA, JP Spark,
                                  EVAHome, ChatPane, AssistMe.
                                ops-face (26): Admin, DevOps, Dev Tools,
                                  DevBench, ADO, DataModel, RedTeam.
                                Routes, status, API calls, persona routing.

  05-GOVERNANCE-MODEL.md        Unified Actor Model, Machine Trust Index (MTI),
                                Decision Engine 9-step pipeline, 12 governance
                                domains, evidence pack pattern, GC compliance
                                alignment, honest state of what is running
                                vs what is specified.

  06-EVA-JP-REBUILD.md          The existing PRODUCTION BILINGUAL JP AI assistant.
                                EVA-JP-v1.2 rebuild state: Fluent v8->v9 migration,
                                WCAG 2.1 AA, EN/FR i18n. Screen/component status
                                matrix. Rebuild phases + session startup guide.
                                Relationship to 44-eva-jp-spark explained.

  07-PROJECT-LIFECYCLE.md       THE COMPLETE EVA PROJECT LIFECYCLE.
                                Ideation -> Bootstrap -> Decompose -> Register ->
                                Execute (DPDCA) -> Verify (eva-veritas).
                                Azure MAF orchestration bridge (ADO -> MAF ->
                                GitHub -> MAF -> ADO) documented in Phase 4.
                                Sprint Workplan (sprint-workplan.json) defined.
                                7-plane authority table (Data / Work / Dispatch /
                                Agent / Code / Evidence / Control / Skills).
                                ADO, GitHub Actions, 29-foundry skills, heartbeats,
                                evidence packs, MTI gate. Naming conventions.
                                Notes for agents (mandatory rules).

--------------------------------------------------------------------------------
 FOUNDING REFERENCE
--------------------------------------------------------------------------------

  "The Agentic State: Rethinking Government for the Era of Agentic AI"
  Global Government Technology Centre, Berlin / Tallinn Digital Summit
  October 9, 2025
  Authors: Luukas Ilves, Manuel Kilian + 20 global digital gov leaders
  URL: https://edrm.net/2025/10/the-agentic-state-a-global-framework-for-
       secure-and-accountable-ai-powered-government/

  EVA is the operationalization of that paper.
  Berlin paper = vision. EVA = running implementation with governance.

--------------------------------------------------------------------------------
 KEY NUMBERS (2026-02-24)
--------------------------------------------------------------------------------

  27 layers   PASS 0 violations   184 endpoints   46 screens
  Faces: assistant-face:20 (citizen/AI), ops-face:26 (admin/ops)
  375 literals   34 services   48 projects   10 personas
  15 feature flags   12 governance domains   6 MTI subscores
  9-step decision engine   2 audit log lanes   7 authority planes
  60 pre-existing coverage WARNs (non-blocking)
  doc-generator service: planned -- auto-generate docs from 27 layers -> Azure Blob

--------------------------------------------------------------------------------
 QUICK REFERENCE: WHAT TO ASK THE MODEL
--------------------------------------------------------------------------------

  Question                              API Call
  ------------------------------------  ----------------------------------------
  All endpoints for eva-brain-api       GET /model/endpoints/?service=eva-brain-api
  Screens for citizen persona           GET /model/screens/?persona=citizen
  What AdminI18nByScreenPage calls      GET /model/screens/AdminI18nByScreenPage
  Which endpoints are planned           GET /model/endpoints/?status=planned
  Services in the model                 GET /model/services/
  Project record for 33-eva-brain-v2   GET /model/projects/33-eva-brain-v2
  Impact if cosmos container changes   GET /model/impact/?container=model_objects
  Graph view of all layers             GET /model/graph/

  Start API if down:
    $env:PYTHONPATH="C:\AICOE\eva-foundation\37-data-model"
    C:\AICOE\.venv\Scripts\python.exe -m uvicorn api.server:app --port 8010

  Health check: Invoke-RestMethod http://localhost:8010/health
  Export:       Invoke-RestMethod http://localhost:8010/model/admin/export
                  -Method POST -Headers @{Authorization="Bearer dev-admin"}

================================================================================
