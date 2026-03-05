# ACCEPTANCE.md -- 37-data-model Done Criteria
<!-- veritas-acceptance: project=37-data-model version=2.1 last-updated=2026-03-05 -->

**Created:** February 19, 2026
**Last Updated:** March 5, 2026 -- Local service DISABLED, Cloud-only architecture, Backup strategy ACCEPTED

---

## Architecture Change (March 5, 2026)

**ACCEPTANCE: Cloud-Only + Backup Strategy**

| Criterion | Test | Result |
|-----------|------|--------|
| No local service | `Get-Process python -like '*8010*'` | No process (port 8010 not listening) |
| Cloud authoritative | Health check returns 200 + cosmos store type | VALID |
| Backup exists | `Test-Path C:\AICOE\eva-foundry\model\*.json` | 30 files, 4,279 objects, 7.2 MB |
| Backup valid | `validate-cloud-sync.ps1` exit code | 0 (VALID) |
| Restore ready | `restore-from-backup.ps1` successfully starts port 8010 | OPERABLE (emergency-only) |
| Docs updated | README, PLAN, STATUS, USER-GUIDE, ACCEPTANCE reference new architecture | COMPLETE |

**Decision:** Port 8010 (localhost) permanently disabled to enforce single source of truth.
All agents use cloud API exclusively. Local backup for disaster recovery only (emergency 24h max).
Backup scripts created: sync-cloud-to-local, validate-cloud-sync, health-check, restore-from-backup.

---

## The Single Test

The model exists to eliminate re-discovery. The acceptance test for any layer is:

> **Can an agent answer the canonical question for that layer in ≤ 3 PowerShell lines
> without reading any source file?**

---

## Layer Acceptance Criteria

### Layer 0 — Services

| Criterion | Command | Expected |
|-----------|---------|----------|
| All services present | `$m.services.Count` | ≥ 22 |
| Each has id, type, tech_stack, port/url | `$m.services \| Select-Object id, type, tech_stack, port` | No nulls |
| Health endpoint documented | `$m.services \| Where-Object { $_.health_endpoint }` | All services |
| Status field present | `$m.services \| Select-Object id, status` | No nulls |

### Layer 1 — Personas

| Criterion | Command | Expected |
|-----------|---------|----------|
| All personas present | `$m.personas \| Select-Object id, label` | ≥ 10 |
| Each has service scope | `$m.personas \| Where-Object { -not $_.services }` | 0 (empty) |
| Machine agents identified | `$m.personas \| Where-Object { $_.type -eq 'machine' }` | ≥ 1 |

### Layer 2 — Feature Flags

| Criterion | Command | Expected |
|-----------|---------|----------|
| All FeatureID enum values present | count | Matches features.py enum count |
| Each flag maps to ≥ 1 persona | `$m.feature_flags \| Where-Object { $_.personas.Count -eq 0 }` | 0 |
| Flag ids match @require_feature usage | cross-ref | 0 mismatches |

### Layer 3 — Containers

| Criterion | Command | Expected |
|-----------|---------|----------|
| All Cosmos containers present | `$m.containers \| Select-Object id, partition_key` | ≥ 6 |
| Each field has name + type + required | `$m.containers \| ForEach-Object { $_.fields } \| Where-Object { -not $_.type }` | 0 |
| partitionKey is a known field | cross-ref | 0 mismatches |

### Layer 4 — Endpoints

| Criterion | Command | Expected |
|-----------|---------|----------|
| All implemented endpoints present | count | ≥ 29 (eva-brain-api Phase 1–4) |
| All planned endpoints present with status=planned | `$m.endpoints \| Where-Object { $_.status -eq 'planned' }` | ≥ 10 (Phase 5–6) |
| Each endpoint has auth[], feature_flag, cosmos_reads/writes | field check | No nulls |
| cosmos_reads/writes reference real container ids | cross-ref | 0 dangling references |
| Impact query works | `$m.endpoints \| Where-Object { $_.cosmos_reads -contains 'translations' }` | ≥ 4 |

### Layer 5 — Schemas (Request/Response)

| Criterion | Command | Expected |
|-----------|---------|----------|
| Every endpoint response_schema resolves | cross-ref schemas.json | 0 dangling |
| Every endpoint request_schema resolves (if present) | cross-ref | 0 dangling |
| Each schema field has type + required | field check | No nulls |

### Layer 6 — Screens

> **Updated Feb 22, 2026 — 11:30 AM ET:** Screen count raised to 15 (WI-9–WI-19 admin-face screens added; 5 `component_path` corrections applied).

| Criterion | Command | Expected |
|-----------|---------|----------|
| All 15 screens present | `$m.screens.Count` | 15 |
| Admin-face screens present | `$m.screens \| Where-Object { $_.app -eq 'admin-face' }` | ≥ 10 |
| Chat face screens present | `$m.screens \| Where-Object { $_.app -eq 'chat-face' }` | ≥ 2 |
| Each screen lists api_calls | `$m.screens \| Where-Object { $_.api_calls.Count -eq 0 -and $_.status -eq 'implemented' }` | 0 |
| api_calls reference real endpoint ids | cross-ref | 0 dangling |
| Chain traversable: screen → endpoint → container | `impact-analysis.ps1 -screen TranslationsPage` | Non-empty |

### Layer 7 — Literals

| Criterion | Command | Expected |
|-----------|---------|----------|
| Every displayed string key has EN + FR default | `$m.literals \| Where-Object { -not $_.default_fr }` | 0 |
| Each literal references ≥ 1 screen | `$m.literals \| Where-Object { $_.screens.Count -eq 0 }` | 0 |
| Keys extracted from actual i18n files | sync-from-source | 0 diff |

### Layer 8 — Agents

| Criterion | Command | Expected |
|-----------|---------|----------|
| All agent-fleet agents present | `$m.agents \| Select-Object id, skill_file` | Matches agent-fleet/app/ |
| Each agent has input_type, output_type, llm_deployment | field check | No nulls |
| Output screens/endpoints are real references | cross-ref | 0 dangling |

### Layer 9 — Infrastructure

| Criterion | Command | Expected |
|-----------|---------|----------|
| All Cosmos containers mapped to Azure resource | `$m.infrastructure \| Where-Object { $_.type -eq 'cosmos_container' }` | Matches containers.json count |
| APIM routes present | `$m.infrastructure \| Where-Object { $_.type -eq 'apim_route' }` | ≥ 1 per endpoint group |
| Key Vault secrets named | `$m.infrastructure \| Where-Object { $_.type -eq 'keyvault_secret' }` | All connection strings |

### Layer 10 — Requirements

| Criterion | Command | Expected |
|-----------|---------|----------|
| All Epics from PLAN.md files present | count match | 0 missing |
| Each requirement links to ≥ 1 endpoint or screen | `$m.requirements \| Where-Object { $_.satisfied_by.Count -eq 0 }` | 0 |
| Test coverage gaps visible | `$m.requirements \| Where-Object { $_.test_ids.Count -eq 0 }` | Actionable list |

---

## L0-L26 Current Object Counts (as of 2026-02-25)

| Layer | Object count | Notes |
|-------|-------------|-------|
| L0 services | 36 | All EVA services registered |
| L1 personas | 10 | GC personas + machine agents |
| L2 feature_flags | 15 | All feature gates |
| L3 containers | 13 | All Cosmos containers |
| L4 endpoints | 187 | 52 implemented + stubs + planned |
| L5 schemas | 36 | Pydantic request/response schemas |
| L6 screens | 46 | admin-face + chat-face + portal-face |
| L7 literals | 375 | Bilingual string keys |
| L8 agents | 12 | AI agent fleet |
| L9 requirements | 29 | ITSG-33 + GC EARB |
| L25 projects | 51 | EVA platform projects with ADO epic IDs |
| **Total** | **4006** | All layers, Cosmos-backed, ACA 24x7 |

---

## L27-L30 -- DPDCA Evolution Plane

Schemas exist; data seeding is Sprint 8-9 work (F37-10).

| Layer | Acceptance condition | Status |
|-------|---------------------|--------|
| L27 sprints | `GET /model/sprints/` returns >= 8 records (Sprint-Backlog + Sprint 1-7), each with `velocity_planned`, `velocity_actual`, `mti_at_close`, `ado_iteration_path` | [ ] NOT STARTED -- F37-10-003 |
| L28 milestones | RUP phase gates seeded with deliverables, sign_off_by, wbs linkage | [ ] Seeded (schema only) |
| L29 risks | Risk matrix entries with probability x impact = risk_score, mitigation owner | [ ] Seeded (schema only) |
| L30 decisions | ADR records with context/decision/consequences, deciders, optional superseded_by | [ ] Seeded (schema only) |

**L27 unlock condition:** seeding sprints.json unblocks 39-ado-dashboard F39-01-004 velocity calc in `/v1/scrum/dashboard`

---

## L33-L34 -- Governance Plane (Data-Model-First Architecture)

Schemas created March 5, 2026. Pilot ready for 07-foundation-layer.

| Layer | Acceptance condition | Status |
|-------|---------------------|--------|
| L33 workspace_config | `GET /model/workspace_config/eva-foundry` returns workspace-level best practices, bootstrap rules, data model config | [x] READY -- schema/model/API complete |
| L34 project_work | `GET /model/project_work/?project_id=07-foundation-layer` returns active work sessions with tasks[], blockers[], metrics{} | [x] READY -- schema/model/API complete |
| L25 projects (enhanced) | `GET /model/projects/07-foundation-layer` returns governance{readme_summary, purpose, key_artifacts[], latest_achievement} and acceptance_criteria[] | [x] READY -- schema complete |

**Acceptance Tests:**

| Criterion | Command | Expected |
|-----------|---------|----------|
| Schemas valid | `Get-Content schema/*.schema.json \| ConvertFrom-Json` | All 3 parse successfully |
| Routers registered | `grep -r "workspace_config_router\|project_work_router" api/` | Found in layers.py + server.py |
| Admin knows layers | `grep "workspace_config\|project_work" api/routers/admin.py` | Found in _LAYER_FILES dict |
| Model files exist | `Test-Path model/workspace_config.json, model/project_work.json` | Both exist |
| Migration tools ready | `Test-Path scripts/seed-governance-from-files.py, scripts/export-governance-to-files.py` | Both exist |
| Pilot data ready | `Test-Path docs/governance-seed-pilot.json` | Exists with 07-foundation-layer data |

**Pilot Deployment (F37-11-008):**
1. PUT workspace_config: `/model/workspace_config/eva-foundry`
2. Merge + PUT project: `/model/projects/07-foundation-layer` (add governance fields)
3. PUT project_work: `/model/project_work/07-foundation-layer-2026-03-03`
4. Test query: `GET /model/projects/07-foundation-layer` returns governance{} and acceptance_criteria[]

**Production Migration (F37-11-009):**
- Run `seed-governance-from-files.py --all-projects` to extract governance for all 59 projects
- Execute bulk PUT for all projects_updates + project_work records
- Verify: `GET /model/projects/` returns all 59 projects with governance fields

**L33-L34 unlock condition:** Pilot deployment eliminates 236 file reads (59 projects × 4 files) for workspace governance queries. Bootstrap queries API instead of reading README/PLAN/STATUS/ACCEPTANCE.

---

## FP / MTI Completeness Criteria

IFPUG FP estimates and the 4th MTI component (`complexity_coverage`, weight=0.15) require these gates:

| Gate | Target | Current | Unblocked by |
|------|--------|---------|--------------|
| `transaction_function_type` on endpoints | 52 implemented endpoints -- EI/EO/EQ (non-null) | 0/52 | F37-10-001 |
| `story_ids[]` on endpoints | >= 1 story per implemented endpoint | 0/52 | F37-10-001 |
| `data_function_type` on containers | 13 containers -- ILF or EIF (non-null) | 0/13 | F37-10-002 |
| FP estimate accuracy | `GET /model/fp/estimate` uses actual classifications, not estimates | Estimates only | After F37-10-001/002 |
| 4th MTI component active | Veritas audit shows 4-component MTI score (3-component is fallback) | 3-component fallback | After story_ids stamped |

---

## Sprint 8-9 Forward Acceptance Criteria [F37-10]

### F37-10-001 -- Endpoint FP Stamping [NOT STARTED]
- 52 implemented endpoints have `transaction_function_type` set (EI, EO, or EQ)
- All 52 have >= 1 entry in `story_ids[]`
- `GET /model/fp/estimate` returns UFP with non-null transaction classifications
- Veritas shows `complexity_coverage` as 4th MTI component

### F37-10-002 -- Container ILF/EIF Stamping [NOT STARTED]
- 13 containers have `data_function_type` set (ILF or EIF)
- `GET /model/fp/estimate` returns DET/FTR breakdown per container

### F37-10-003 -- Sprints.json Seeding [NOT STARTED]
- `model/sprints.json` has >= 8 records
- `GET /model/sprints/` returns all records via ACA
- 39-ado-dashboard `/v1/scrum/dashboard` includes `velocity_actual` from sprint records

### F37-10-004 -- Same-PR Enforcement [NOT STARTED]
- `.github/workflows/validate-model.yml` exists and runs on PRs
- PRs that modify source without updating model JSON fail workflow
- Completes in < 2 minutes on GitHub-hosted runner

### F37-10-005 -- Drift Detection [NOT STARTED]
- `scripts/drift-detection.ps1` compares model endpoint IDs vs live FastAPI routes
- Reports missing entries in both directions
- JSON output compatible with `coverage-gaps.ps1`

### F37-10-006 -- Mermaid Output [NOT STARTED]
- `GET /model/graph?format=mermaid` returns valid Mermaid ERD string
- Renders without errors in mermaid.live
- T47 in `tests/test_graph.py` added

---

## End-State Acceptance (All Entity Layers Complete)

When all entity layers are populated and F37-10 complete:

1. **Field rename in < 5 seconds:** `GET /model/impact/?container=translations`
   returns every affected endpoint, schema, screen, and literal.

2. **No grep loops:** An agent starting fresh answers any structural question from
   the API alone, without reading any source file.

3. **validate-model.ps1 exits 0:** Zero schema violations, zero dangling cross-references.

4. **Same-PR rule holds:** `.github/workflows/validate-model.yml` blocks source-only commits
   without a corresponding model update.

5. **Full traceability:** `Epic --> REQ --> GET /v1/... --> Screen --> TestCase` is a single
   graph traversal query via `GET /model/graph/?node_id=X&depth=3`.

6. **IFPUG UFP accurate:** `GET /model/fp/estimate` returns calculated (not estimated)
   UFP with all transaction and data function counts from stamped records.

7. **Velocity visible:** `GET /model/sprints/` returns Sprint 1-7 records; 39-ado-dashboard
   renders velocity trend chart from actual sprint data.

---

## Cross-Cutting CI Gates (must remain true after every sprint)

| Criterion | Command | Expected |
|-----------|---------|----------|
| No schema violations | `POST /model/admin/commit` | violation_count = 0 |
| All objects exported | `POST /model/admin/export` | exported_total >= 4006 |
| Tests pass | `pytest tests/ -q` | >= 40/41 passing |
| Veritas MTI | `audit_repo` on 37-data-model | MTI >= 95 |
| ACA Cosmos reachable | `GET /health` | store = cosmos |
| Row version monotonic | After every PUT | row_version = prev_rv + 1, modified_by logged |

---

## Known Pre-Existing Failures (not acceptance blockers)

| ID | Test | Root cause | Resolution |
|----|------|-----------|------------|
| T36 | `test_reseed_does_not_duplicate` | ReseedError on in-memory store when data pre-loaded | Pre-existing before Sprint 5 -- deferred |

40/41 is the current passing bar. Any regression below 40 is a blocker.
