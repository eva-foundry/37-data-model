================================================================================
 EVA FOUNDATION -- MASTER OVERVIEW
 File: docs/library/00-EVA-OVERVIEW.md
 Updated: 2026-02-24 @ 15:30 ET -- Two-portal split ratified; face field on all 46 screens
 Source: 37-data-model (single source of truth, port 8010, store=cosmos)
--------------------------------------------------------------------------------
 DOCUMENTATION GENERATION VISION (registered 2026-02-24)
--------------------------------------------------------------------------------

  The data model is the single source of truth for all 27 layers.
  Vision: the model generates its own documentation automatically.

  Trigger:  POST /model/admin/commit (on every PASS cycle)
  Output:   Markdown docs + Mermaid diagrams, one file per layer
  Storage:  Azure Blob Storage, eva-docs container
            Pathed as: eva-docs/{layer}/{YYYYMMDD}-{layer}.md
  Service:  doc-generator (registered in L0 services layer)
  Status:   planned

  What gets generated per commit:
    - Layer summary docs (counts, key fields, notable items)
    - Cross-reference diagrams (graph view: screens -> endpoints -> services)
    - Architecture snapshots (update 02-ARCHITECTURE.md automatically)
    - Screen catalog (replace 04-PORTAL-SCREENS.md with API-live data)
    - Compliance artifacts (for ATO evidence pack in 48-eva-veritas)

  Long-term: this docs/library folder becomes the OUTPUT of the model,
  not a manually maintained document set. The model runs; the docs follow.
  Azure Blob (eva-docs) serves as persistent, versioned documentation storage
  accessible across dev, staging, and production environments.

================================================================================

This file is the canonical orientation document for the EVA ecosystem.
Read this first. Every other library file goes deeper on one topic.

--------------------------------------------------------------------------------
 FOUNDING THESIS
--------------------------------------------------------------------------------

EVA is a Government of Canada (GC) AI operating model -- not just a chatbot.

It is grounded in "The Agentic State: Rethinking Government for the Era of
Agentic AI" (Global Government Technology Centre, Berlin / Tallinn Digital
Summit, October 9, 2025 -- Luukas Ilves, Manuel Kilian, 20+ contributors).

That paper defines the VISION (what governments must become).
EVA is the IMPLEMENTATION (architecture + governance + evidence, running code).

The Berlin paper states what nobody has built yet:
  "AI agents must be governed with the same rigour as the humans they represent"

EVA operationalizes that claim:
  - Every actor (human or AI) passes through the same governance plane
  - Trust is computed, not assumed (Machine Trust Index)
  - Evidence is produced at runtime, not assembled after the fact
  - Cost is attributed at the request level (FinOps headers)
  - Red teaming is continuous, not a one-time gate

--------------------------------------------------------------------------------
 WHAT EVA IS NOT
--------------------------------------------------------------------------------

NOT a chatbot wrapper                   -- it is an agentic operating model
NOT a single application                -- it is a platform of ~48 projects
NOT a prototype waiting for funding     -- it has running infrastructure in Azure
NOT coupled to one LLM                  -- model-agnostic by design (via APIM)
NOT a one-person spike                  -- it is architecturally production-ready

--------------------------------------------------------------------------------
 THE 48-PROJECT ECOSYSTEM
--------------------------------------------------------------------------------

Projects are numbered 01-48 under C:\AICOE\eva-foundation\.
They fall into five bands:

  CORE PLATFORM (always running, always needed)
  -----------------------------------------------
  33-eva-brain-v2        Agentic backend. FastAPI on ACA. Chat, RAG, analysis,
                         translate, feedback. 24 skills registered in Copilot.
  37-data-model          Single source of truth API. FastAPI port 8010 on ACA.
                         27 layers. 184 endpoints. 46 screens. Store=Cosmos.
  40-eva-control-plane   Runtime evidence spine. Port 8020. Run records,
                         deployment audit trail, evidence packs.

  FRONTEND / PORTAL (user-facing surfaces)
  -----------------------------------------
  EVA-JP-v1.2 **PRODUCTION APP BEING REBUILT**
    Path:   C:\AICOE\EVA-JP-v1.2
    What:   The EXISTING bilingual JP AI assistant (EN/FR). GC federal govt.
            Case workers + legal staff query EI, CPP, OAS jurisprudence.
    Stack:  React 18 + Fluent UI v8->v9 (IN PROGRESS) + FastAPI backend.
    Rebuild: Fluent v8 removed, v9 only. WCAG 2.1 AA. i18n EN/FR. TS strict.
             3 of 8 screens DONE. 15 components still MIX/v8.
    Spec:   eva-jp-rebuild-spec.json (631 lines -- read before touching code)
    See:    docs/library/06-EVA-JP-REBUILD.md for full analysis.

  31-eva-faces           TWO-PORTAL FRONTEND. React 19 + Fluent UI v9.
                         WCAG 2.1 AA. react-i18next. 46 registered screens.
                         Two SWA deployment targets:
                           assistant-face (20 screens) -- citizen / AI-use portal
                             Auth, EVA DA suite, JP Spark, Chat, AssistMe
                           ops-face (26 screens) -- admin / control-plane portal
                             Admin, DevOps, Dev Tools, DevBench
                         face field set in Cosmos on all 46 screens (PASS 0 violations).
                         Phases 1+2 complete. Phase 3 (wiring) next.
  44-eva-jp-spark        Next-gen portal-integrated JP assistant. Phase 3.
                         Inherits EVA-JP-v1.2 rebuild as reference impl.
                         GC Design System + Fluent UI v9. 8 screens.
  27-devbench            COBOL/legacy modernization. 5 screens.
  45-aicoe-page          Public React 19 + Fluent UI landing page.
  46-accelerator         Workspace booking portal.

  GOVERNANCE + TRUST (policy, evidence, security)
  ------------------------------------------------
  19-ai-gov              AI Governance Plane design authority. 12 governance
                         domains. Unified Actor Model. Decision Engine spec.
                         Context Envelope contract. Cosmos container schemas.
  47-eva-mti             Machine Trust Index computation. 6 subscores -> MTI.
                         Trust Service OpenAPI. Split from 19-ai-gov Feb 2026.
  48-eva-veritas         Evidence Plane. Governance-grade CLI + MCP server.
  (was: orchestrator)    "Planned vs Actual Truth Engine."
                         Verifies WHAT ACTUALLY EXISTS vs what was declared.
                         3rd plane alongside data plane (37) + control (40).
                         Formula: MTI = Coverage*0.4 + Evidence*0.4 + Consist.*0.2
                         Deploy gate: MTI < 70 = block.
                         Phase 1 COMPLETE (5 CLI cmds: discover/reconcile/
                         compute-trust/generate-ado/report).
                         Phase 2 ACTIVE: MCP server -> hosted in 29-foundry.
  36-red-teaming         Promptfoo adversarial testing harness. MITRE ATLAS.
  28-rbac                Production-ready RBAC for EVA-JP-v1.2.
  32-logging             Centralized structured logging. Two lanes:
                         PIPEDA audit + structural/operational.

  ORCHESTRATION + DATA (intelligence layer)
  ------------------------------------------
  29-foundry             Agentic capabilities hub. MCP servers, multi-agent
                         orchestrator, RAG pipeline, evaluation, observability.
                         6 technical skills. Hosts eva-veritas MCP server.
  05-extract-cases       JP SQLite to XML dataset pipeline.
  08-cds-rag             CDS RAG analysis artifacts.
  11-ms-infojp           PubSec-Info-Assistant reference MVP.

  DEVELOPER + OPERATIONS (platform services)
  --------------------------------------------
  17-apim                Azure API Management. Single gateway + FinOps headers
                         (X-Client-ID, X-Cost-Center, X-Feature-Flag).
  38-ado-poc             ADO Command Center. Sprint board. PBI management.
                         Scrum orchestration hub. Port 8010 proxy.
  14-az-finops           Azure FinOps. Cost management dashboards.
  22-rg-sandbox          Active Azure sandbox. ~18 resources.
  43-spark               Shared EVA design system (Spark Springboard).
  07-foundation-layer    Patterns + templates source. Copilot instructions seed.

--------------------------------------------------------------------------------
 AZURE INFRASTRUCTURE (sandbox, personal subscription)
--------------------------------------------------------------------------------

  Resource               Name / FQDN
  -----------------------------------------------------------------------
  Cosmos DB              marco-sandbox-cosmos.documents.azure.com
                         db=evamodel, container=model_objects, partition=/layer
  ACA (data-model)       marco-eva-data-model.livelyflower-7990bc7b.
                         canadacentral.azurecontainerapps.io
  ACA (brain-v2)         marco-eva-brain-api.[region].azurecontainerapps.io
  APIM                   marco-sandbox-apim.azure-api.net
  Azure OpenAI           GPT-4o (production) / GPT-5.1-chat (deployed)
  AI Search              JP jurisprudence corpus (vector + semantic)
  Blob Storage           Uploaded documents, analysis output
  Entra ID               Auth + persona-based claims (MSAL)

  Local dev endpoints:
  37-data-model API      http://localhost:8010
  40-control-plane        http://localhost:8020
  Start command:
    $env:PYTHONPATH="C:\AICOE\eva-foundation\37-data-model"
    C:\AICOE\.venv\Scripts\python.exe -m uvicorn api.server:app --port 8010

--------------------------------------------------------------------------------
 DATA MODEL STATE (2026-02-24)
--------------------------------------------------------------------------------

  Metric                 Count
  -----------------------------------------------
  Layers                 27 / 27   (PASS 0 violations)
  Endpoints              184       (52 implemented, 37 stub, 95 planned)
  Screens                46        (assistant-face:20, ops-face:26. WCAG 2.1 AA + i18n)
  Literals               375
  Services               33
  Projects               48
  Feature flags          15
  Components             32
  Hooks                  18
  Containers             13        (Cosmos collections)
  Schemas                36
  Personas               10
  Agents                 4
  Infrastructure items   23
  Requirements           22
  Coverage WARNs         60        (pre-existing repo_line, non-blocking)

--------------------------------------------------------------------------------
 THE FIVE DESIGN PRINCIPLES
--------------------------------------------------------------------------------

  1. EVIDENCE-FIRST
     Every AI action emits immutable evidence at runtime.
     Evidence is not assembled retroactively; it is a first-class output.
     "If it didn't produce evidence, it didn't happen."

  2. TRUST IS COMPUTED
     No actor is unconditionally trusted.
     Machine Trust Index (MTI) = composite score (0-100) from 6 subscores:
     Identity Trust (ITI), Behaviour Trust (BTI), Compliance Trust (CTI),
     Evidence Trust (ETI), Security Trust (STI), Audit Reliability (ARI).
     MTI drives graduated autonomy: 95=fully autonomous, 50=human-in-loop,
     20=block.

  3. GOVERNANCE IS RUNTIME
     The Decision Engine evaluates every intent before execution.
     9-step pipeline: validate -> catalog -> profiles -> hard-stops ->
     MTI -> controls -> thresholds -> decision -> audit.
     Output: ALLOW / ALLOW_WITH_CONDITIONS / REQUIRE_HUMAN / DENY.

  4. COST IS ATTRIBUTED
     Every API call carries X-Client-ID, X-Cost-Center, X-Feature-Flag.
     APIM enforces attribution headers. FinOps dashboard reads real data.
     "Ungoverned AI spend is ungovernable AI."

  5. OPEN TO SCRUTINY
     Red teaming is continuous (Promptfoo + MITRE ATLAS).
     ATO artifacts are generated, not written after the fact.
     PIPEDA audit lane and structural log lane are separate and immutable.

--------------------------------------------------------------------------------
 KEY FILES TO READ NEXT
--------------------------------------------------------------------------------

  01-AGENTIC-STATE.md            The Berlin paper <-> EVA mapping
  02-ARCHITECTURE.md             ASCII system architecture (DIAGRAM 8: two-portal split)
  03-DATA-MODEL-REFERENCE.md     All 27 layers + doc-generation vision
  04-PORTAL-SCREENS.md           All 46 screens by face (assistant/ops)
  05-GOVERNANCE-MODEL.md         Actor model, MTI, decision engine, domains

  External reading:
  19-ai-gov/README.md              19-ai-gov project scope
  19-ai-gov/EVA-AIatGov.md         Core three-layer principle
  19-ai-gov/EVA-Actor-Governance.md   Unified actor model
  19-ai-gov/EVA-Machine-trust-Index.md  MTI theory
  19-ai-gov/eva-decision-engine-spec.md  Decision Engine YAML spec
  33-eva-brain-v2/copilot-instructions.md  Brain-v2 PART 2

================================================================================
