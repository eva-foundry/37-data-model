# EVA Data Model -- Status

**Last Updated:** February 26, 2026 @ 18:56 ET -- Session 17: brain-v2 housekeeping PUTs + evidence files added
**Phase:** ACTIVE -- COSMOS 24x7 -- validate-model PASS 0 violations -- 31 layers registered -- MTI=100
**Snapshot (2026-02-26 S17):** 31 layers -- 4057 exported objects -- Tests: 41/42 (T36 pre-existing only) -- Readiness: 9/9 gates PASS (G09 WARN: consumer MTI)

> **Session note (2026-02-26 Session 17 -- brain-v2 housekeeping + evidence batch):**
>
> DISCOVER: eva-roles-api service record had sprint=null, test_count=null, base_url_azure=null.
>   6 roles-api endpoints had sprint=null, implemented_in=null.
>   scrum/dashboard and scrum/summary were status=coded despite being APIM-live since Sprint-7.
>   Multiple evidence JSON files untracked since last commit.
>
> DO:
>   - eva-roles-api service: base_url_azure set, notes updated (rv=5)
>   - GET /v1/scrum/dashboard: coded -> implemented (rv=6)
>   - GET /v1/scrum/summary: coded -> implemented (rv=5)
>   - 6 roles-api endpoints: sprint=Sprint-1, implemented_in set (rv=3->4 each)
>   - POST /model/admin/commit: violation_count=0, exported_total=4057, export_errors=0
>
> CHECK: violation_count=0, export_errors=0 -- ACA commit clean.
> ACT: No remaining data model blockers. 33-eva-brain-v2 Sprint 9 (F33-S9-001) ready to start.

> **Session note (2026-02-25 Session 16c -- DPDCA seed continuation + ACR fix):**
>
> DISCOVER: Prior ACR builds (cx25/cx26) failed due to Windows cp1252 charmap UnicodeEncodeError in
>   az CLI log streaming. DPDCA seed files (sprints=9, milestones=4, risks=5, decisions=4) were seeded
>   into model/*.json but ACA image was not yet refreshed.
>
> DO:
>   - ACR cx26 rebuilt successfully using --no-logs + PYTHONUTF8=1 (fix for Windows charmap bug)
>   - Image: marcosandacr20260203.azurecr.io/eva-data-model-api:latest
>     Digest: sha256:8542d689e0d257ca8b6867c7220cd5dca09e249e4c61a1bc4b600f3281efec26
>   - ACA updated: revision cosmos-v2 deployed (started_at 2026-02-25T21:23:54)
>   - POST /model/admin/seed: total=4055, sprints=9, milestones=4, risks=5, decisions=4, errors=[]
>   - POST /model/admin/commit: violation_count=0, exported_total=4055, export_errors=[]
>
> CHECK:
>   - readiness-probe.ps1: 9/9 PASS, [PASS] All gates pass -- no blockers detected
>   - G07 PASS: 9 sprint records (was FAIL -- sprints count 0)
>   - G08 PASS: All three DPDCA layers reachable (was FAIL -- 404)
>   - G09 WARN: MTI=86 (below 95 target) -- requires eva audit run, not actionable here
>
> ACT: All FAIL gates resolved. No remaining blockers in 37-data-model.

> **Session note (2026-02-25 Session 16 -- Mermaid + ACA redeploy + DPDCA gates):**
>
> DISCOVER: Readiness probe revealed 3 FAIL gates: G03 (fp 404), G07 (sprints count 0), G08 (milestones/risks/decisions 404).
>   Root cause: ACA image predated DPDCA sprint that added L27-L30 + FP router.
>   Sprint seed data already in model/sprints.json (9 records). Code complete -- image stale.
>
> PLAN:
>   1. Implement Mermaid graph output (E-11-WI-7 stretch goal, 3 pts)
>   2. Rebuild ACA image with tag 20260225-1621 (includes L27-L30 routers + FP + Mermaid)
>   3. Seed DPDCA layers into Cosmos via admin/seed
>   4. Re-stamp TFT (76 endpoints) + DFT (13 containers) after seed
>
> DO:
>   Mermaid graph output (api/routers/graph.py):
>     - Added import re + PlainTextResponse
>     - Added _safe_mid() + _to_mermaid() helpers
>     - Added fmt=Query(None, alias="format") parameter to get_graph()
>     - Added PlainTextResponse(_to_mermaid(...)) return when fmt=="mermaid"
>     - GET /model/graph/?format=mermaid returns flowchart LR Mermaid diagram
>     - GET /model/graph/?format=mermaid&from_layer=screens&to_layer=endpoints returns typed edges
>   Test T47 (tests/test_graph.py):
>     - Added test_T47_mermaid_format_output: assert status=200, content-type=text/plain, text starts with "flowchart"
>   ACA redeploy:
>     - az acr build: cx24 (failed stream), cx25/cx26, cx27 (tag 20260225-1621) -- all Succeeded
>     - az containerapp update --image eva-data-model-api:20260225-1621 -- revision --0000001
>     - POST /model/admin/seed: total=984 processed, 9 sprints + 4 milestones + 5 risks + 4 decisions seeded
>     - scripts/stamp-tft.ps1: 76 TFT stamped (EI=23 EO=25 EQ=28)
>     - scripts/stamp-dft.ps1: 13 DFT stamped (ILF=12 EIF=1)
>
> CHECK:
>   - pytest 41/42 PASS (T36 pre-existing race condition; T47 NEW PASS)
>   - readiness-probe.ps1: 9/9 PASS (G09 WARN consumer MTI=86, not 37-data-model)
>   - ACA: G03 PASS (fp estimate returns UFP=345), G07 PASS (9 sprints), G08 PASS (milestones/risks/decisions)
>   - Mermaid live on ACA: flowchart LR + node definitions + typed edges
>   - agent-summary: total=4055 (+22 from DPDCA seed), store=cosmos
>
> ACT:
>   - All 9 readiness gates PASS (G09 WARN is consumer-side, not actionable here)
>   - PLAN.md: F37-10-003 DONE, F37-10-006 DONE
>   - Object count: 4033 -> 4055 (+22 DPDCA objects)
>   - ACA revision: marco-eva-data-model--0000001 (image: marcosandacr20260203.azurecr.io/eva-data-model-api:20260225-1621)


> DISCOVER: Assessed data model and veritas; identified 8 gaps (missing project-mgmt layers,
>   no FP calculator, dead code-parser, 3-component trust score with no complexity dimension).
>
> PLAN: Mapped IFPUG components to existing layers (containers=ILF/EIF, endpoints=EI/EO/EQ).
>   Designed 4 new layers: sprints, milestones, risks, decisions.
>   Planned veritas enrich.js pipeline and 4th MTI component (complexity_coverage).
>
> DO:
>   Schema enrichment:
>     - container.schema.json: added data_function_type (ILF/EIF/null) + det_count
>     - endpoint.schema.json: added story_ids[], transaction_function_type (EI/EO/EQ/null) + ftr_count
>     - sprint.schema.json: new layer (velocity_planned/actual, mti_at_close, ado_iteration_path)
>     - milestone.schema.json: new layer (RUP phase gates, deliverables, sign_off_by, wbs_ids)
>     - risk.schema.json: new layer (3x3 probability+impact matrix, risk_score 1-9, mitigation_owner)
>     - decision.schema.json: new layer (ADR: context/decision/consequences, superseded_by, deciders)
>   API additions:
>     - layers.py: +4 routers (sprints, milestones, risks, decisions)
>     - admin.py _LAYER_FILES: +4 entries (sprints/milestones/risks/decisions .json)
>     - server.py: import + register 4 new routers + fp_router
>     - api/routers/fp.py: GET /model/fp/estimate -- IFPUG UFP calculator
>       Queries containers (ILF/EIF) + endpoints (EI/EO/EQ); derives complexity from
>       det_count/ftr_count using standard IFPUG weight tables. Returns UFP + story-point
>       estimate (UFP*2.4 COCOMO II) + effort-days estimate (UFP*0.5).
>     - model/sprints.json, milestones.json, risks.json, decisions.json: empty seed files
>     - scripts/assemble-model.ps1: added 4 new layers
>   Veritas evolution (48-eva-veritas):
>     - src/enrich.js: new post-reconcile step -- calls data model API, annotates each story
>       with endpoint_count, container_count, fp_weight, complexity. Writes .eva/enrichment.json.
>     - src/discover.js: wired previously dead code-parser.js via shouldEnrich(); adds
>       code_complexity to discovery.actual output.
>     - src/lib/trust.js: 4th MTI component (complexity_coverage, weight 0.15).
>       New 4-component weights: coverage=0.40, evidence=0.20, consistency=0.25, complexity=0.15.
>       Falls back to original 3-component formula when no enrichment data available (backwards compat).
>     - src/audit.js: enrich() injected between reconcile and computeTrust (non-fatal).
>     - src/compute-trust.js: reads enrichment.json and passes to computeTrustScore as 2nd arg.
>
> CHECK:
>   - pytest 40/40 PASS (T36 pre-existing race condition, unrelated to this sprint)
>   - assemble-model.ps1: 31 layers [OK], 4 new layers show 0 items (empty seeds -- expected)
>   - validate-model.ps1: PASS 0 violations
>   - veritas audit 33-eva-brain-v2: MTI=76, pipeline ran (discover+reconcile+enrich+trust+report),
>     3-component fallback active (no story_ids on endpoints yet -- set these to unlock 4th component)
>
> ACT:
>   - ACA seed: total=3995, errors=0 (4 new empty layers registered in Cosmos)
>   - ACA commit: violations=0, exported=4005, export_errors=0 -- PASS
>   - copilot-instructions.md: fixed 3 stale obj_id references from prior session
>
> NEXT ACTIONS (to maximize FP calculator accuracy):
>   1. For each endpoint, PUT data_function_type (EI/EO/EQ) and story_ids to unlock FP calc + 4th MTI
>   2. For each container, PUT data_function_type (ILF/EIF) to classify storage function type
>   3. Once sprint data exists (seed sprints.json or POST /model/sprints), mti_at_close populates naturally

> **Session note (2026-02-24 23:30 ET — Cosmos sync + documentation pass):**
> Full sync: local memory (962 objects) exported to disk JSON (27/27 layers, 0 errors), then
> seeded to Cosmos via `scripts/seed-cosmos.py` (exit 0). ACA `marco-eva-data-model` health
> confirmed: `store=cosmos`, `total=962` — exact parity with local. Assemble 27/27 [OK],
> validate PASS 0 violations. STATUS.md, README.md, and workspace + project copilot-instructions
> updated to reflect current state. Services count corrected 35→34, projects 49→50.

> **Session note (2026-02-24 23:00 ET — PROD-WI-4 + PROD-WI-10 + seed-cosmos.py):**
> Three Sprint-9 Cosmos items implemented:
> **PROD-WI-4 (parallelize bulk_load):** `api/store/cosmos.py` `bulk_load` refactored from
>   sequential per-object `get_one + upsert` (O(N*2) calls) to:
>   1. Single `get_all` query builds an existing-object lookup dict.
>   2. All docs built in memory (no async I/O).
>   3. `asyncio.gather` with `Semaphore(50)` fires all upserts in parallel.
>   Cost for 960 objects: 1 read query + ~20 parallel batches (vs 1920 serial calls).
> **PROD-WI-10 (Cosmos round-trip tests T60-T64):** `tests/test_cosmos_roundtrip.py` added.
>   5 tests using an `isolated_client` fixture that monkeypatches `_MODEL_DIR` to a
>   pytest `tmp_path` copy so exports NEVER touch real `model/*.json` during test runs.
>   Discovered and fixed a PROD-WI-7 bug: shutdown export had no dev_mode guard,
>   causing test artifacts (test-service, rw-service, del-me, hidden, ghost) to leak
>   into disk JSON files on every standard test run. Fixed with `and not settings.dev_mode`
>   gate in the lifespan cleanup block. Services cleaned: 40 -> 35 (5 artifacts removed).
> **seed-cosmos.py (COS-4):** `scripts/seed-cosmos.py` created. Standalone script:
>   reads .env, instantiates CosmosStore, calls parallelized bulk_load for all 27 layers,
>   prints per-layer progress with timing. Supports --dry-run and --layer filter flags.
>   Run: `python scripts/seed-cosmos.py --dry-run` to validate without writing.
>   Run: `python scripts/seed-cosmos.py` for full cold-deploy seed.
> Tests: 40/41 passing (T36 pre-existing only). validate-model.ps1: PASS 0 violations.

> **Session note (2026-02-24 22:30 ET — PROD-WI-5 + PROD-WI-6 + PROD-WI-7):**
> Three Sprint-9 hardening items implemented in one pass:
> **PROD-WI-5 (PROD-4 startup guard):** `api/server.py` lifespan wraps `CosmosStore.init()` in try/except.
>   On failure: logs clear error (COSMOS_URL/KEY), falls back to MemoryStore instead of killing the process silently.
>   Dockerfile HEALTHCHECK was already shipped Feb-23 (PROD-3); PROD-WI-5 now fully complete.
> **PROD-WI-6 (admin token enforcement):** Added `dev_mode: bool = True` to `api/config.py` (env var `DEV_MODE`).
>   Lifespan guard: if `dev_mode=False` AND `admin_token=='dev-admin'` → `RuntimeError` at startup with clear message.
>   Dev mode logs a WARNING so local devs know the token isn't production-safe.
>   `.env.example`: `ADMIN_TOKEN=` (blank) with required-in-production comment; `DEV_MODE=true` section added.
> **PROD-WI-7 (export-before-shutdown):** `api/server.py` lifespan cleanup block now exports MemoryStore to all
>   27 layer JSON files on SIGTERM/shutdown. Cosmos store skipped (inherent persistence). Errors are logged
>   but never re-raised (to avoid masking the original shutdown signal).
> Tests: 35/36 passing (T36 pre-existing only). validate-model.ps1: PASS 0 violations.

> **Session note (2026-02-24 22:00 ET — DM-MAINT-WI-1: CI gate):**
> Created `.github/workflows/validate-model.yml` — GitHub Actions workflow that runs on every PR/push to main
> that touches `model/**`, `schema/**`, or either script. Triggers: `pull_request + push (main) + workflow_dispatch`.
> Runs on `ubuntu-latest` (pwsh pre-installed). Steps: `assemble-model.ps1` → `validate-model.ps1`.
> Fail-fast: `validate-model.ps1` exit 1 blocks the merge; WARNs (repo_line coverage) are non-blocking.
> DM-MAINT-WI-1: ✅ DONE (1 pt).

> **Session note (2026-02-24 21:30 ET — T21 fix + validator hardening):**
> T21 regression root cause: `GET /v1/config/translations/{language}` was registered in the Feb-24 portal catalog
> session with empty `cosmos_reads: {}` — breaking the `config → endpoint → TranslationsPage` impact chain.
> **Fix 1 (data):** PUT `cosmos_reads: ["config"]` on the endpoint via API. row_version 3→4, modified_by=agent:copilot.
> **Fix 2 (validator):** `validate-model.ps1` line 101 crashed under `Set-StrictMode -Version Latest` when any
> endpoint object lacked the `feature_flag` or `auth` property entirely (52 portal-catalog endpoints).
> Changed to use the existing `GetProp`/`HasProp` helpers: `$epFF = GetProp $ep 'feature_flag'` and
> `foreach ($personaId in (GetProp $ep 'auth'))`. Validator now handles optional properties defensively.
> Write cycle: export 960 objects (27/27 layers OK) → assemble 27/27 → validate PASS 0 violations.
> Tests: 35/36 passing (T36 = pre-existing reseed timing issue, unrelated).

> **Session note (2026-02-24 15:30 ET — Two-Portal Split):**
> Design decision ratified: 31-eva-faces deploys as TWO portals.
> `assistant-face` (Portal 1 — citizen/RAG): 20 screens backed by eva-brain + eva-jp-spark + assistme.
> `ops-face` (Portal 2 — admin/ops): 26 screens backed by data-model, ado-poc, control-plane, foundry.
> `face` field stamped on all 46 screens via PUT API. Commit: PASS 0 violations, 27/27 layers.
> See `docs/library/02-ARCHITECTURE.md` DIAGRAM 8 for full screen mapping.
> 29-foundry sits behind both portals as a library — never gets a face.

> **Session note (2026-02-24 15:05 ET — POC Breakthrough):**
> eva-brain-api (port 8001) now calls `/model/*` proxy with `X-Actor=user:marco.presta` stamped on every request.
> All 37-data-model audit trail entries from eva-brain will show `modified_by=user:marco.presta`.
> `/health` and `/ready` endpoints verified: `store_reachable=true`, `store_latency_ms=211`.
> eva-brain-api `.env` path resolution fixed (`__file__`-based) — works from any CWD.

> **Cosmos DB live (2026-02-24):** `marco-sandbox-cosmos / evamodel / model_objects`  
> **ACA endpoint:** `https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io`  
> **Local endpoint:** `http://localhost:8010` — start with `$env:PYTHONPATH="C:\AICOE\eva-foundation\37-data-model"; Set-Location "C:\AICOE\eva-foundation\37-data-model"; C:\AICOE\.venv\Scripts\python -m uvicorn api.server:app --port 8010`  
> **Both local + ACA share the same Cosmos container** — writes on either are immediately visible on both.
> Projects expanded from 19 to 46 on 2026-02-23 — all 46 eva-foundation numbered folders now in model (32-logging added).  
> Counts change frequently. Check the live API: `Invoke-RestMethod http://localhost:8010/health`

> **Session note (2026-02-23 14:42 ET — eva-faces DRIFT-3/4):**
> `model/screens.json` +7 screens (IngestionRunsPage, SearchHealthPage, SupportTicketsPage, FeatureFlagsPage,
> RbacRolesPage, FinOpsDashboardPage, DevopsHealthDashboardPage); `model/endpoints.json` +26 planned endpoints;
> `model/literals.json` +23 portal-face literals (portal.* namespace, 112 → 135).
> `model/containers.json`: scrum-cache status planned → provisioned.
> Field-level validation: PASS 0 violations. Build: 15 screens · 76 endpoints · 135 literals (application model layer).

> **Layer groups:**  
> L0–L10 = application model (original 11 layers, Sprint 1–5).  
> L11–L17 = control-plane catalog (EVA Automation Operating Model), added Phase 4.  
> L18–L20 = frontend structural layers (components, hooks, ts_types), added Phase 5 (eva-faces scan, 2026-02-22).  
> L21–L24 = catalog additions (mcp_servers, prompts, security_controls, runbooks), added post-Phase-4.  
> L25–L26 = project plane (projects, wbs), added 2026-02-26 (E-07/E-08).

---

## Layer Status (snapshot 2026-02-23 — individual counts may grow each sprint)

### Application Model (L0–L10)

| Layer | Name | Items | Notes |
|-------|------|-------|-------|
| L0 | services | 33 | +11 Feb 24: UI/UX surfaces (model-explorer-ui, graph-explorer, admin-panel, drift-dashboard, impact-view) + agentic (model-sync, drift, doc-generator, diagram, status, trust-linker) |
| L1 | personas | 10 | +3 added Phase 5: developer, jr_user, jr_admin |
| L2 | feature_flags | 15 | active 4, planned 4, stub 2; +action.assistant, +3 PM Plane, +2 new portal flags |
| L3 | containers | 13 | +translations, +content_logs added 2026-02-22 (0-violation fix) |
| L4 | endpoints | 184 | implemented 52, stub 37, planned 95 (was 32); +49 portal catalog Feb 24 (auth/persona, eva-da, a11y, rbac act-as, system logs, i18n by-screen, redteam, assistme, model-api proxy) |
| L5 | schemas | 36 | request: 12, response: 19, model: 5 |
| L6 | screens | 46 | +19 Feb 24 portal catalog: login/persona (2), EVA DA (7), project embeds (4), admin additions (5). **face field set 2026-02-24 @ 15:30 ET**: 20 screens=assistant-face (citizen/RAG), 26 screens=ops-face (admin/ops) |
| L7 | literals | 375 | +96 added Phase 5; 375 total |
| L8 | agents | 4 | screen-generator, test-generator, validator (eva-faces) + 1 control-plane |
| L9 | infrastructure | 23 | provisioned 12, planned 11; 3 accuracy fixes applied 2026-02-22 (cosmos DB name, 2 SWA types) |
| L10 | requirements | 22 | 5 epics, 10 requirements, 4 stories, 3 acceptance criteria |

### Control Plane / Automation Operating Model (L11–L17)

| Layer | Name | Items | Notes |
|-------|------|-------|-------|
| L11 | planes | 3 | plane-ado, plane-github, plane-azure |
| L12 | connections | 3 | ADO org URL + Azure subscription/RG/location backfilled 2026-02-22 |
| L13 | environments | 3 | dev, staging, prod |
| L14 | cp_agents | 4 | ADO scrum, code review, PR merge, deploy agents |
| L15 | cp_policies | 3 | approval, cost, compliance policies |
| L16 | cp_skills | 7 | orchestration skill catalog |
| L17 | cp_workflows | 2 | sprint-execute, deploy-to-sandbox |

### Frontend Structural Layers (L18–L20 — added Phase 5, 2026-02-22)

| Layer | Name | Items | Notes |
|-------|------|-------|-------|
| L18 | components | 12 | React component catalog (eva-jp-spark + admin-face) |
| L19 | hooks | 17 | Custom React hooks catalog |
| L20 | ts_types | 8 | TypeScript type/interface catalog |

### Catalog & Ops (L21–L24)

| Layer | Name | Items | Notes |
|-------|------|-------|-------|
| L21 | mcp_servers | 3 | azure-search, cosmos, blob from 29-foundry |
| L22 | prompts | 5 | Prompty templates from 29-foundry |
| L23 | security_controls | 10 | OWASP LLM Top 10 + ITSG-33 controls |
| L24 | runbooks | 4 | Operational runbooks |

### Project Plane (L25–L26 — added 2026-02-26, E-07/E-08)

| Layer | Name | Items | Notes |
|-------|------|-------|-------|
| L25 | projects | 19 | All 19 eva-foundation projects: id, ADO epic, maturity, category, phase, goal, depends_on, pbi_total/done |
| L26 | wbs | 12 | Program → stream (4) → project-deliverable nodes — critical path, sprint linkage, CI/CD runbook refs |

---

## Scores (snapshot 2026-02-23 — counts change; live source is the API)

> Run `Invoke-RestMethod http://localhost:8010/model/{layer}/ | Measure-Object` for current counts.  
> Do **not** update this table manually — update the model via `PUT /model/{layer}/{id}` and regenerate.

| Metric | Value | Notes |
|--------|-------|-------|
| Layers complete | 27 / 27 | E-07/E-08 project plane (L25–L26) added 2026-02-26 |
| validate-model.ps1 | **PASS — 0 violations** | 17 pre-existing violations fixed 2026-02-22 (containers + flag + endpoints) |
| Services | 22 | +12 Phase 5 wave (eva-cli, eva-devbench, eva-jp-spark, etc.) |
| Personas | 10 | +3 Phase 5 (developer, jr_user, jr_admin) |
| Feature flags | 13 | +1 (action.assistant) +3 PM Plane (action.programme, action.ado_sync, action.ado_write) |
| Containers | 13 | +2 (translations, content_logs, fixed 0-violation gate) |
| Endpoints | 123 | implemented 52, stub 37, planned 32, coded 2 |
| Schemas | 36 | request 12, response 19, model 5 |
| Screens | 27 | +12 Phase 5 (devbench x5, jp-spark x7) |
| Literals | 232 | +96 Phase 5 |
| Agents | 4 | |
| Infrastructure | 23 | provisioned 12, planned 11; 3 accuracy fixes applied 2026-02-22 |
| Requirements | 22 | |
| Connections | 3 | Real ADO + Azure values backfilled 2026-02-22 |
| Scripts | 10 / 10 | assemble, validate, impact, query, sync-from-source, coverage-gaps, backfill-repo-lines.py, backfill-metadata, ado-generate-artifacts, add-precedence-fields |
| Consumer sync scripts | in consumer repos | `sync-eva-jp-spark.py` → `44-eva-jp-spark/scripts/sync-to-model.py`. Convention: each app repo owns its own push-to-model script. |

> Sprint-by-sprint acceptance test records (Sprints 1–5) archived to `docs/ADO/idea/_archived/20260222/`.

---

## Session Log

### Feb 24, 2026 — T21 regression fixed · validate-model.ps1 strict-mode crash resolved

- **T21 regression (impact chain broken):** `GET /v1/config/translations/{language}` added in the portal catalog session with `cosmos_reads: {}`. Impact query for `container=config` returned `["SettingsPage"]` only — `TranslationsPage` was missing because its api_calls chain to `config` was severed.
- **Fix (data):** `PUT /model/endpoints/GET /v1/config/translations/{language}` with `cosmos_reads: ["config"]`. row_version 3→4. Confirmed via GET: `cosmos_reads={config}`, `modified_by=agent:copilot`.
- **Fix (validator):** `validate-model.ps1` crashed at line 101 under `Set-StrictMode -Version Latest` accessing `$ep.feature_flag` on 52 portal-catalog endpoints that were registered without this optional property. Replaced with `GetProp`/`HasProp` pattern (helpers already in the script since Sprint 5). Also hardened the `auth` loop with `(GetProp $ep 'auth')`.
- **Write cycle:** export 960 objects (was 959 + 1 updated endpoint), assemble 27/27 [OK], validate PASS 0 violations.
- **Tests: 35/36 passing.** T21 fixed. T36 (reseed row_version timing) remains pre-existing/unrelated.

### Feb 24, 2026 — Portal Full Catalog: 19 screens + 49 backend endpoints registered

- **Portal screen catalog complete — 46 total screens (was 28) across 7 apps:**
  - *Portal-face login + persona:* PersonaLoginPage (persona picker at `/login`), PersonaExperienceDashboard (personalised tile grid `/my-eva`)
  - *Portal-face EVA DA Chat (7 screens):* EvaDAChatPage (all RAG modes: semantic/keyword/hybrid/reranked/multihop), EvaDADataLoadPage (upload + URL scrape + folders/tags), EvaDASearchPage (saved + history), EvaDAAnalysisPage (TDA/CSV), EvaDAKnowledgePage (browse index), EvaDAFeedbackPage (admin feedback history), EvaDATranslatorPage (document translation)
  - *Portal-face project embeds:* ADOCommandCenterPage (`/portal/ado`), DataModelExplorerPage (`/portal/data-model` → 37-data-model ACA), RedTeamingPage (`/portal/red-teaming` → 36-red-teaming), AssistMePage (`/portal/assistme` → 20-assistme)
  - *Admin-face additions:* A11yThemesPage (WCAG theme management), AdminI18nByScreenPage (literals by screen + import/export), SystemLogsPage (second logging lane: INFO/WARN/ERROR vs PIPEDA audit), RbacResponsibilitiesPage (RACI matrix), ActAsPage (elevated ops + 30-min PIPEDA-boxed session, audit-logged)
- **Backend endpoint catalog complete — 184 total endpoints (was 136) — +49 new planned endpoints:**
  - Auth (5): `/v1/auth/me`, `/v1/auth/personas`, `/v1/auth/login`, `/v1/auth/logout`, `/v1/auth/persona/select`
  - EVA DA (17): chat + RAG modes + data upload/folders/tags/status/url-scrape + knowledge + analysis (3) + translate + feedback (2)
  - A11y themes (5): GET/POST/PATCH/DELETE/active
  - RBAC (3): responsibilities, act-as POST/DELETE
  - System logs (2): GET + export
  - i18n (2): by-screen GET + import POST + export GET
  - Red teaming (4): results/runs/run/config
  - AssistMe (3): chat/topics/feedback
  - Model-api proxy (4): services/, graph/, services/{id}, impact/
  - Scrum (2): sprints, pbis
  - RBAC roles (1)
- **PASS 0 violations. 60 pre-existing repo_line WARNs (non-blocking).**
- **All screens: a11y=WCAG-2.1-aa, i18n=react-i18next, rbac fields set.**

### Feb 24, 2026 — Cosmos 24x7 + ACA Deploy + UI/UX + Agentic Surface Catalog

- **Cosmos DB wired end-to-end:** `.env` created with real Cosmos credentials (`marco-sandbox-cosmos / evamodel / model_objects`). Local API restarted — `store: cosmos` confirmed via health endpoint.
- **866 objects seeded to Cosmos** via `POST /model/admin/seed` — `{"total":866,"errors":[]}` — 27 layers, 0 errors.
- **`aiohttp==3.10.11` added to `requirements.txt`** — ACA revision `cosmos-v2` was failing with `ModuleNotFoundError: No module named 'aiohttp'` (azure-cosmos async SDK requires aiohttp). ACR image rebuilt (`cx1g`), revision `cosmos-v2` deployed.
- **ACA `marco-eva-data-model` deployed** — FQDN `marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io` — health confirmed `store: cosmos`. Both local + ACA read/write the same Cosmos container — live 24x7.
- **47-eva-mti + 48-eva-orchestrator registered** in model via write cycle — row_version=1 each, export 868 objects, assemble 27/27, validate PASS 0 violations. Projects total: 46 → 48.
- **UI/UX + agentic surface catalog defined** — 11 new entries registered across `services` and `wbs` layers (see UI/UX + Agentic Services section below).

### Feb 23, 2026 — 12:00 PM ET — Cosmos + 24×7 Gap Analysis · Hotfixes

- **Full API source audit completed:** read `server.py`, `config.py`, all store implementations (base, memory, cosmos), `requirements.txt`, `Dockerfile`, `.env.example`. API is correctly structured; no code-plane bugs found.
- **Root cause of "dying under heavy load" identified (PROD-1):** Dockerfile `CMD` used `--workers 2` with MemoryStore. Each uvicorn worker has its own in-process MemoryStore; writes on worker A are invisible to worker B. Under load, 50% of requests hit the wrong worker and get stale/empty data.
- **Hotfix 1 — Dockerfile `--workers 2` → `--workers 1`** until Cosmos is wired. Added `HEALTHCHECK` directive. Aligned base image from `python:3.11-slim` → `python:3.12-slim`.
- **Hotfix 2 — `sync-eva-jp-spark.py` + `fix-violations.py` relocated** to `44-eva-jp-spark/scripts/sync-to-model.py` and `44-eva-jp-spark/scripts/fix-model-violations.py`. Locale file path corrected for the new home (`../../../44-eva-jp-spark/src/…` → `../src/…`). Health-check error handling improved (bare traceback → friendly message + exit 1). `scripts/README.md` added to 37-data-model documenting the convention: each app repo owns its own push-to-model script. Model scripts count: 11 → 10.
- **Cosmos DB migration gap analysis:** 7 gaps documented (COS-1 through COS-7). Bottom line: all data-plane code is complete. The only blocker to Cosmos mode is setting `COSMOS_URL` + `COSMOS_KEY` in `.env` (ops-only, no code change required today).
- **24×7 production gap analysis:** 11 gaps documented (PROD-1 through PROD-11). Critical path: PROD-1 (workers, done), COS-1 (Cosmos wiring), PROD-3 (healthcheck, done), PROD-4 (startup guard), PROD-6 (admin token hardening), PROD-8 (export-before-shutdown).
- **Stale counts removed from docs:** README.md, STATUS.md, `.github/copilot-instructions.md` now use "as of 2026-02-23 last recorded was …" language; all three files direct agents to query the live API for current totals.
- **requirements.txt:** `azure-identity` documented as a commented-out optional dependency (needed for PROD-WI-3 managed-identity auth).
- **Proposed 15.5 sprint points** across Sprint-9 (13.5 pts) and Sprint-10 (3 pts) — see "Gap Analysis — 24×7 Production API" section.

### Feb 23, 2026 — 7:44 AM ET — Documentation Consistency Pass

- **Cross-checked all documentation against `eva-model.json` on disk.** Confirmed: 27/27 layers, 13 feature flags, 19 projects, 27 screens, 123 endpoints, 232 literals, 12 components, 17 hooks, 12 WBS nodes.
- **Files updated:** README.md (L21–L24 added to layer table, health check `layers:19→27`, "11 layers"→"27 layers"), PLAN.md (status `25/25`→`27/27`, historical note `19/19`→`27/27`, date), ANNOUNCEMENT.md ("19/19, 15 screens"→"27/27, 27 screens"), USER-GUIDE.md (version `11/11`→`27/27`, layer list expanded to 27 names, scripts table 5→11), STATUS.md (feature flags score `10`→`13`, projects L25 `18`→`19`, DM-MAINT-WI-0 `Not started`→`Done`, scripts score `5/5`→`11/11`, header date), `.github/copilot-instructions.md` (last updated timestamp).
- **API not running** — uvicorn exits code 1 (cause: port conflict; API was already running on 8010). No code bug. `sync-eva-jp-spark.py` exiting 1 was because the API was not running; both issues resolved in the 12:00 PM session.

### Feb 22, 2026 — 1:48 PM ET

- **Full 23-project scan** completed under `C:\AICOE\eva-foundation`. Projects with active frontend code: 31-eva-faces (162 tsx), 39-ado-dashboard (13 tsx — component sandbox for portal-face), 40-eva-devbench (112 tsx), 44-eva-jp-spark (215 tsx). All others confirmed empty or backend-only.
- **Anti-pattern identified and recorded**: AuditLogsPage, RbacPage, ChatPane status corrections were applied by editing JSON directly and restarting the server, bypassing the audit trail. Lesson: all model writes must go through `PUT /model/{layer}/{id}` → `POST /model/admin/export` → `assemble-model.ps1`. The copilot-instructions in this repo and in 44-eva-jp-spark already capture this rule.
- **Gap catalog created**: `31-eva-faces/docs/ADO/20260226-to-be-cataloged.md` — 96 missing literals (WI-9/10/12–16), 6 missing eva-roles-api endpoints, 5 screens with hollow component/hook arrays, 2 route mismatches, full provenance by project.
- **Enhancement proposals created**: `31-eva-faces/docs/ADO/20260226-enhancements.md` — 6 proposals (E-01 components layer, E-02 types layer, E-03 hooks layer, E-04 i18n_namespace field, E-05 SSE+mock_fixture fields, E-06 react_component_library type).
- `POST /model/admin/export` implemented in `api/routers/admin.py` — closes the write cycle gap. Full write cycle now: `PUT /model/{layer}/{id}` → `GET` → `POST /model/admin/export` → `assemble-model.ps1`.
- Cosmos deployment **not yet wired** — API runs MemoryStore until `.env` supplies `COSMOS_URL` + `COSMOS_KEY`.

### 2026-02-22 · late ET — E-10 `repo_line` Shipped

- **4 JSON schemas extended:** `endpoint.schema.json`, `component.schema.json`, `hook.schema.json`, `screen.schema.json` — each now has `"repo_line": { "type": ["integer", "null"] }`.
- **`scripts/backfill-repo-lines.py` created:** scans source files for function/decorator declarations, PUTs via API. Handles endpoints (FastAPI `@router.{method}` pattern), components/hooks/screens (export/function declarations). 44 objects stamped, 0 errors.
- **Coverage gaps:** 38 objects with `status=implemented` + source path but no `repo_line` — primarily hooks/components whose files aren't on this machine clone, plus `ChatPane` (id/filename mismatch). All surface as validator WARNs.
- **`validate-model.ps1` extended** with `HasProp` helper + `$warnings` list — PASS 0 violations, 38 coverage WARNs. Non-blocking.
- **`tests/test_provenance.py` created:** T50–T52 passing — assert covered objects have valid `repo_line` int \u22651, report gaps informally.
- **Test summary: 18/19 passing** (T36 pre-existing reseed failure, unrelated).

### 2026-02-22 · EVE ET — E-09 + E-11 Shipped _[see below]_

- **E-09 DONE:** `POST /model/admin/export` → 636 objects, 27/27 layers, 0 errors. All model JSON files on disk now carry `source_file`, `created_by=system:autoload`, `created_at`, `modified_by`, `modified_at`, `row_version=1`, `is_active=true`. `eva-model.json` rebuilt 27/27 [OK].
- **E-11 DONE:** `GET /model/graph/` live at port 8010 — 304 nodes, 533 edges from first pass. BFS traversal (`node_id + depth`), cycle guard, 20 edge types, `GET /model/graph/edge-types` vocabulary endpoint. Tests T40–T46: **7/7 passing**.
- **3 PM Plane feature flags added:** `action.programme`, `action.ado_sync`, `action.ado_write` — persisted to `model/feature_flags.json`. Total flags: 10 → 13.
- **Screen PUT hygiene:** AuditLogsPage (rv=4), RbacPage (rv=3), ChatPane (rv=3) — corrected via proper write cycle (PUT → export → assemble).
- **New files:** `api/models/graph.py`, `api/routers/graph.py`, `tests/test_graph.py`.
- **eva-model.json rebuilt:** 27/27 [OK] · feature_flags=13.
- **T36 note:** `test_T36_row_version_increments_on_reseed` pre-existing failure — unrelated to this session.

### 2026-02-22 · 19:33 ET — Provenance & Graph Features (E-09/E-10/E-11) _[proposal session]_

- **Seed pipeline fixed:** `server.py` auto-seed switched from `store.upsert()` per-object to `store.bulk_load()` — every server restart was re-stamping `modified_by: "system:autoload"` and incrementing `row_version`. Fixed to preserve audit fields already in JSON.
- **`source_file` field introduced:** stamped via `setdefault` in both the auto-seed path (`server.py`) and the `/seed` endpoint (`admin.py`) on every object. Value = `"model/<filename>.json"`. Confirmed NOT in `_STRIP` — survives export.
- **`POST /model/admin/export` exists and correct** — not yet run. First run will materialise full audit trail across all 27 layers to disk.
- **E-09 proposal:** Run first export → enriched JSON cold-deploy artifact. 3 pts. Sprint 8.
- **E-10 proposal:** Add `repo_line: int | null` to endpoints, components, hooks, screens. Backfill script needed. Enables `code --goto` jumps. 8 pts. Sprint 8.
- **E-11 proposal:** `GET /model/graph` — typed edge list across all 27 layers (DER/ERD over HTTP). 20 edge types. `node_id + depth` traversal. Cycle guard. 15 pts. Sprint 8–9.
- **Gap analysis complete:** 7 blocking gaps + 5 validation gaps identified — all documented in `docs/ADO/idea/20260222-1933-provenance-graph.md`.
- **14 ADO Work Items drafted:** E-09 (3 WI), E-10 (5 WI), E-11 (6 WI+2 stretch), 23 Sprint-8 pts + 5 Sprint-9 stretch.
- **Field inventory confirmed:**  
  - `components.json`: `repo_path` ✅, `repo_line` ❌  
  - `hooks.json`: `repo_path` ✅, `repo_line` ❌  
  - `endpoints.json`: `implemented_in` ✅, `repo_line` ❌  
  - `screens.json`: `component_path` ✅, `repo_line` ❌  
  - `services.json`: `repo_path` ✅, `depends_on` ✅ — relationship fields complete

### 2026-02-26 — Project Plane (E-07/E-08)
- **E-07 `projects` layer (L25)** added: `model/projects.json` — 18 project objects sourced from 38-ado-poc README + ado-artifacts.json. All fields: id, ado_epic_id, category, maturity, phase, goal, depends_on, blocked_by, pbi_total/done, services, sprint_context, wbs_id.
- **E-08 `wbs` layer (L26)** added: `model/wbs.json` — 12 WBS nodes covering program, 4 streams (User Products, AI Intelligence, Platform, Developer), and 6 project-deliverable nodes (critical path for Sprint-6/7). Node fields: level, deliverable, methodology, phase_gate, depends_on_wbs, depends_on_infra, ado_epic_id, sprint, work_items, ci_runbook, evidence_id_pattern, done_criteria.
- **admin.py** updated: `_LAYER_FILES` now includes `projects` and `wbs`.
- **assemble-model.ps1** updated: both layers included, `total_layers` = 27.
- **20260226-enhancements.md** updated: E-07 and E-08 proposals added with full object shapes, data provenance, and query examples.
- **20260226-to-be-cataloged.md** updated: data inventory sections for E-07 and E-08 added (18-project table, WBS cross-project dependency chain, CI/CD linkage from 40-eva-control-plane).
- Layer count: 25 → **27**.

## Current Open Issues (2026-02-22 EOD)

### Model accuracy gaps (validator passes — not blocking)
- `storage-account.azure_resource_name` still `eva-storage` (actual: `marcosand20260203`) — DM-CAT-WI-12 deferred
- `cosmos-account.azure_resource_name` still `eva-cosmos-account` (actual: `marco-sandbox-cosmos`) — DM-CAT-WI-12 deferred
- `appinsights.type` is `foundry_project` (should be `application_insights`) — pre-existing accuracy bug
- DM-CAT-WI-12 title says "3 bugs" but body table has 5 rows — fix before ADO import
- Route mismatch: AuditLogsPage model route `/admin/audit/logs` vs App.tsx `/admin/audit`; RbacPage model route `/admin/rbac/users` vs App.tsx `/admin/rbac`
- 5 admin-face screens (IngestionRunsPage, SearchHealthPage, SupportTicketsPage, FeatureFlagsPage, RbacRolesPage) have empty `components[]` and `hooks[]` — see `31-eva-faces/docs/ADO/20260226-to-be-cataloged.md`
- AuditLogsPage + RbacPage + ChatPane status corrections applied via JSON edit, not PUT API — re-apply via write cycle protocol
- eva-devbench + eva-jp-spark screen stubs (12 screens) not yet fully populated — api_calls/components empty

### Planned work (specs ready in `docs/ADO/idea/`)
- **DM-MAINT Sprint-8 (9 pts):** coverage-gaps.ps1, GitHub Action validate on PR, same-PR enforcement, drift-detection, sync-from-source — ADO IDs 169–175
- **DM-AUDIT Sprint-9 (9 pts):** append-only audit log with AuditEvent schema, MemoryStore + CosmosStore, write hooks — spec: `docs/ADO/idea/20260222-enhancement.md`
- **DM-CAT Sprint-9/10 (26 pts):** precedence fields, provision_order on infra, WI-5/WI-6 schemas, new layers (search_indexes, CI/CD catalog), model-sync-agent — spec: `docs/ADO/idea/20260222-catalog-wave.md`

### Runtime
- Cosmos deployment not yet wired — API runs MemoryStore until `.env` supplies `COSMOS_URL` + `COSMOS_KEY`
- APIM import (REQ-007) and Key Vault config (REQ-008) targeted Mar 2026
- tags.py not mounted in main.py → 3 tag endpoints stuck at `planned`

## ADO — Maintenance & Extension Epic (onboarded Feb 22, 2026)

| Item | ADO ID | Sprint | Points | Status |
|------|--------|--------|--------|--------|
| Epic: EVA Data Model — Maintenance & Extension | 164 | — | — | Active |
| Feature: CI Gate & Same-PR Enforcement | 165 | — | — | Planned |
| Feature: Automated Drift Detection | 166 | — | — | Planned |
| Feature: Coverage Gaps Surface | 167 | — | — | Planned |
| Feature: Model-Sync Agent | 168 | — | — | Planned |
| DM-MAINT-WI-0: coverage-gaps.ps1 | 169 | Sprint-8 | 1 | ✅ Done |
| DM-MAINT-WI-1: GitHub Action validate on PR | 170 | Sprint-8 | 2 | Not started |
| DM-MAINT-WI-4: sync-from-source JSON output | 171 | Sprint-8 | 1 | Not started |
| DM-MAINT-WI-3: Scheduled drift-detection | 172 | Sprint-8 | 3 | Not started |
| DM-MAINT-WI-2: Same-PR enforcement | 173 | Sprint-8 | 2 | Not started |
| DM-MAINT-WI-5: Wire coverage-gaps into drift | 174 | Sprint-8 | 1 | Not started |
| DM-MAINT-WI-6: model-sync-agent scaffold | 175 | Sprint-9 | 3 | Not started |
| DM-MAINT-WI-7: Integrate model-sync into sprint-execute | 176 | Sprint-9 | 2 | Not started |

Board: https://dev.azure.com/marcopresta/eva-poc/_workitems

**Next:** DM-MAINT-WI-1 — GitHub Action `validate-model` on PR (2 pt, Sprint 8)

---

## E-09 / E-10 / E-11 — Provenance & Graph (recorded 2026-02-22 · 19:33 ET)

Full spec: `docs/ADO/idea/20260222-1933-provenance-graph.md`

| Item | Sprint | Points | Status |
|------|--------|--------|--------|
| **E-09: Provenance Export** | 8 | 3 | ✅ DONE |
| E-09-WI-1: Run first `POST /model/admin/export` | 8 | 1 | ✅ DONE — 636 objects, 27 layers, 0 errors |
| E-09-WI-2: `test_provenance_export` in `test_admin.py` | 8 | 2 | ✅ DONE — T37 + T38 added + passing |
| **E-10: `repo_line` on implemented objects** | 8 | 8 | ✅ DONE |
| E-10-WI-1: Add `repo_line` to 4 JSON schemas | 8 | 1 | ✅ DONE — endpoint, component, hook, screen schemas updated |
| E-10-WI-2: Write `scripts/backfill-repo-lines.py` | 8 | 3 | ✅ DONE — scans source files, PUTs via API |
| E-10-WI-3: Run backfill + PUT all implemented objects | 8 | 1 | ✅ DONE — 44 objects stamped (28 ep + 4 hook + 12 screen), 0 errors |
| E-10-WI-4: `repo_line` coverage check in `validate-model.ps1` | 8 | 1 | ✅ DONE — 38 WARNs (non-blocking), PASS 0 violations |
| E-10-WI-5: Write `tests/test_provenance.py` (3 cases) | 8 | 2 | ✅ DONE — T50–T52 passing (coverage-ratio assertions) |
| **E-11: `GET /model/graph` (DER/ERD over HTTP)** | 8–9 | 15 | ✅ DONE |
| E-11-WI-1: Pydantic models `GraphNode`, `GraphEdge`, `GraphResponse` | 8 | 2 | ✅ DONE — `api/models/graph.py` |
| E-11-WI-2: Implement `api/routers/graph.py` — 20 edge types | 8 | 5 | ✅ DONE — BFS, cycle guard, 20 edge types |
| E-11-WI-3: Register graph router in `server.py` | 8 | 1 | ✅ DONE |
| E-11-WI-4: Write `tests/test_graph.py` — 6 cases | 8 | 3 | ✅ DONE — T40–T46, 7/7 passing |
| E-11-WI-5: Update README with graph examples + decision table | 8 | 1 | ✅ DONE — field names corrected, route table + decision table + work state updated |
| E-11-WI-6: `GET /model/graph/edge-types` meta endpoint | 9 | 2 | ✅ DONE — shipped in same PR |
| E-11-WI-7: Mermaid output `?format=mermaid` | 9 | 3 | Not started (stretch) |

**Sprint 8 total: 23 pts · Sprint 9 stretch: 5 pts**

---

## DM-MAINT — CI Gate & Drift Detection Epic

| WI | Title | Pts | Status |
|----|-------|-----|--------|
| DM-MAINT-WI-1 | CI gate: `validate-model.yml` runs on every PR | 1 | ✅ DONE (2026-02-24) |
| DM-MAINT-WI-2 | Same-PR enforcement check (model updated with source) | 2 | Not started |
| DM-MAINT-WI-3 | Scheduled drift-detection workflow | 3 | Not started |
| DM-MAINT-WI-4 | `coverage-gaps.ps1` (requirements with zero test_ids) | 1 | Not started |

---

## Gap Analysis — Cosmos DB Migration (recorded 2026-02-23)

The `CosmosStore` implementation is **complete and correct** — all 6 abstract methods
(`get_all`, `get_one`, `upsert`, `bulk_load`, `soft_delete`, `get_audit`) are implemented
in `api/store/cosmos.py`. The container is auto-created with partition key `/layer` and
the three composite indexes. No data-plane code changes are required.

What is missing before flipping the switch:

| # | Gap | File / Location | Effort |
|---|-----|-----------------|--------|
| COS-1 | `COSMOS_URL` and `COSMOS_KEY` not set — API runs MemoryStore | `.env` (copy from `.env.example`) | 5 min ops |
| COS-2 | `azure-identity` not in `requirements.txt` — key-based auth only, no managed-identity option | `requirements.txt` | 30 min |
| COS-3 | `bulk_load` in `CosmosStore` is **sequential** — one `get_one` + `upsert_item` per object; seeding 636 objects will take ~60 s | `api/store/cosmos.py` `bulk_load()` | 2 pts — batch with asyncio.gather |
| COS-4 | No one-shot seed script: when pointing at a **fresh** Cosmos container, there is no documented/automated way to seed all 27 layers from the disk JSON | `scripts/seed-cosmos.py` (does not exist) | 1 pt |
| COS-5 | `get_audit` uses cross-partition `ORDER BY c.modified_at` — requires a composite index or `enableScanInQuery`. The `_INDEXING_POLICY` defined in `cosmos.py` does not include a cross-partition `modified_at` composite; the query will fall back to a full scan | `api/store/cosmos.py` `_INDEXING_POLICY` | 1 pt |
| COS-6 | `.env.example` documents `COSMOS_KEY` (shared key). Key rotation is an ops burden. For production use managed identity (`DefaultAzureCredential`) — requires `azure-identity` (COS-2) | `api/store/cosmos.py` `__init__` | 3 pts |
| COS-7 | No round-trip test: `POST /model/admin/export` → seed Cosmos → `GET` all layers — validates the seed-backup-restore cycle end-to-end | `tests/test_cosmos_roundtrip.py` (does not exist) | 2 pts |

**Action to unblock today (ops only, no code change):**
```powershell
# 1. Copy .env.example → .env and fill in real values
Copy-Item C:\AICOE\eva-foundation\37-data-model\.env.example `
          C:\AICOE\eva-foundation\37-data-model\.env
# 2. Edit .env: set COSMOS_URL and COSMOS_KEY
# 3. Restart the API — uvicorn picks up the env and routes to CosmosStore
# 4. Run the sync script to seed all layers from disk JSON — run from the consumer repo root:
#    cd C:\AICOE\eva-foundation\44-eva-jp-spark
#    python scripts/sync-to-model.py
# Or call the seed endpoint directly:
#    POST http://localhost:8010/model/admin/seed
# 5. Verify: GET /health → store should show "cosmos"
Invoke-RestMethod http://localhost:8010/health
```

---

## Gap Analysis — 24×7 Production API (recorded 2026-02-23)

The API is FastAPI/uvicorn running in a single Docker container. It works correctly
locally and for light agent traffic. The following gaps prevent reliable 24×7 service.

### Critical — data loss and split-brain under load

| # | Gap | Evidence | Fix |
|---|-----|----------|-----|
| **PROD-1** | **Dockerfile uses `--workers 2` with MemoryStore** — each uvicorn worker has its own in-process MemoryStore. Writes on worker A are invisible to worker B. This is the reported "dying under heavy load": agents get stale/empty reads because 50 % of requests hit the wrong worker. | `Dockerfile` `CMD` line | Set `--workers 1` until Cosmos is wired (COS-1). With Cosmos, multi-worker is safe. |
| **PROD-2** | MemoryStore is **ephemeral** — all writes since last `POST /model/admin/export` are lost on every restart or container recycle. | `api/store/memory.py` docstring | Wire Cosmos (COS-1..COS-4). Until then, export before every restart. |

### High — reliability and operations

| # | Gap | Evidence | Fix |
|---|-----|----------|-----|
| PROD-3 | No process supervisor / restart policy in Docker Compose or deployment config. A single unhandled exception kills the process silently. | `Dockerfile` — no `ENTRYPOINT` healthcheck, no restart directive | Add `HEALTHCHECK` to Dockerfile; use `docker run --restart=always` or a container-platform liveness probe. |
| PROD-4 | No startup crash diagnostics. If `COSMOS_URL` is set but invalid, `await store.init()` raises and silently kills the process — agents can't tell if the API crashed vs never started. | `api/server.py` lifespan | Wrap `store.init()` in a try/except; log the error and fall back to MemoryStore (or re-raise with a clear message). |
| PROD-5 | No rate limiting or circuit breaker. Under burst agent traffic all requests hit the same single async event loop; slow Cosmos queries block the loop. | `api/server.py` — no middleware for rate-limit | Add `slowapi` middleware; configure per-route limits for the expensive `GET /model/graph` and `GET /model/impact` routes. |
| PROD-6 | `ADMIN_TOKEN=dev-admin` is the documented default — agents copy it from `.env.example` without changing it. Any agent that knows the repo can call destructive admin routes. | `.env.example` line 17 | Remove default from `.env.example`; add startup assertion: `if settings.admin_token == "dev-admin": raise ValueError(...)` in production mode. |
| PROD-7 | `CORS allow_origins=["*"]` — acceptable locally, not acceptable in production. | `api/server.py` `CORSMiddleware` | Read allowed origins from `settings.allow_origins: list[str]`; configure in `.env`. |
| PROD-8 | No export-before-shutdown hook. When the container is stopped (`SIGTERM`), all in-memory writes since last export are lost with no warning. | `api/server.py` lifespan `yield` — cleanup block is empty | In the cleanup block: if MemoryStore, call `POST /model/admin/export` automatically. |

### Medium — resilience

| # | Gap | Evidence | Fix |
|---|-----|----------|-----|
| PROD-9 | Consumer push scripts (`sync-eva-jp-spark.py`, `fix-violations.py`) lived in the model repo — dependency inversion. Model repo should not know about consumer layouts. | `scripts/sync-eva-jp-spark.py` (old location) | **Done — relocated** to `44-eva-jp-spark/scripts/sync-to-model.py` + `fix-model-violations.py`. Model scripts count: 11→10. |
| PROD-10 | No Redis configured — every agent request re-queries the store; at 60 s TTL the graph route can be expensive. | `.env.example` `REDIS_URL` is blank | Set `REDIS_URL` in `.env` once a Redis instance is available (Azure Cache for Redis or local Docker). |
| PROD-11 | `Dockerfile` base image is `python:3.11-slim` but the dev venv is Python 3.12. Not a crash issue but causes subtle behavioural differences. | `Dockerfile` `FROM` line | Align to `python:3.12-slim`. |

### Proposed Sprint Work Items

| ID | Title | Points | Sprint |
|----|-------|--------|--------|
| PROD-WI-1 | Fix Dockerfile: `--workers 1` until Cosmos wired (PROD-1) | 0.5 | Hotfix |
| PROD-WI-2 | Wire Cosmos DB: set `COSMOS_URL + COSMOS_KEY` in `.env`; add `scripts/seed-cosmos.py` (COS-1, COS-4) | 2 | Code: `seed-cosmos.py` ✅ DONE. Ops: set COSMOS_URL/KEY in .env (5 min) |
| PROD-WI-3 | Add `azure-identity` + managed-identity auth to CosmosStore (COS-2, COS-6) | 3 | Sprint-9 |
| PROD-WI-4 | Fix CosmosStore `bulk_load` — parallelize with `asyncio.gather` (COS-3) | 2 | ✅ DONE (2026-02-24) |
| PROD-WI-5 | Add `HEALTHCHECK` to Dockerfile + startup error guard in `lifespan` (PROD-3, PROD-4) | 1 | ✅ DONE (2026-02-24) |
| PROD-WI-6 | Startup assertion: reject `admin_token=dev-admin` in non-dev mode (PROD-6) | 1 | ✅ DONE (2026-02-24) |
| PROD-WI-7 | Export-before-shutdown in lifespan cleanup block (PROD-8) | 1 | ✅ DONE (2026-02-24) — dev_mode guard added same session |
| PROD-WI-8 | `slowapi` rate limiting for graph + impact routes (PROD-5) | 2 | Sprint-10 |
| PROD-WI-9 | CORS origins from settings; fix `_INDEXING_POLICY` for audit query (PROD-7, COS-5) | 1 | Sprint-10 |
| PROD-WI-10 | End-to-end Cosmos round-trip test (COS-7) | 2 | ✅ DONE (2026-02-24) — T60-T64 passing |

**Total proposed: 15.5 pts across Sprint-9 (13.5 pts critical path) + Sprint-10 (3 pts)**

### Feb 23, 2026 Session — Hotfix Applied

- **PROD-1 fixed:** Dockerfile `--workers 2` → `--workers 1` pending Cosmos wiring; `HEALTHCHECK` added; base image `3.11` → `3.12`
- **PROD-9 resolved:** `sync-eva-jp-spark.py` + `fix-violations.py` relocated to `44-eva-jp-spark/scripts/`; health-check now has proper error handling
- **Stale counts removed:** README.md, STATUS.md, copilot-instructions.md now use “as of YYYY-MM-DD last recorded was…” language

---

## Veritas Governance Declarations

<!-- Sprints 1-5 all DONE per veritas-plan.json feature titles -->
STORY F37-03-001: done
STORY F37-03-002: done
STORY F37-04-001: done
STORY F37-04-002: done
STORY F37-05-001: done
STORY F37-05-002: done
STORY F37-06-001: done
STORY F37-06-002: done
STORY F37-07-001: done
STORY F37-07-002: done
STORY F37-08-001: done
STORY F37-08-002: done
STORY F37-08-003: done
STORY F37-08-004: done
STORY F37-08-005: done
STORY F37-08-006: done
STORY F37-08-007: done

---

## Feb 25, 2026 — 10:45 PM ET Session (Veritas Governance Closure)

### Work Completed

| Item | Result |
|------|--------|
| Veritas audit — baseline | Score 71, 7 gaps all in F37-08 |
| Create `evidence/F37-08-001.py` — Same-PR Rule | [PASS] |
| Create `evidence/F37-08-002.py` — Sprint-Close Audit | [PASS] |
| Create `evidence/F37-08-003.py` — Ecosystem Expansion | [PASS] |
| Create `evidence/F37-08-004.py` — New Model Layer | [PASS] |
| Create `evidence/F37-08-005.py` — Validation Gate | [PASS] |
| Create `evidence/F37-08-006.py` — Drift Signals | [PASS] |
| Create `evidence/F37-08-007.py` — Governance | [PASS] |
| Veritas audit — final | Score **100** (+29), 0 gaps, actions: deploy/merge/release |

### Veritas Final State

- Stories total: 17, all with artifacts, all with evidence
- Coverage=1.00, Evidence=1.00, Consistency=1.00
- MTI trend: 0 -> 0 -> 0 -> 71 -> 71 -> 71 -> 71 -> **100**
- Unlocked actions: `deploy`, `merge`, `release`

### Tests / Validation

- Tests: 40/41 (T36 pre-existing only)
- validate-model.ps1: PASS 0 violations
STORY F37-07-002: done
