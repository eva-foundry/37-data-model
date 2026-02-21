# EVA Data Model — Acceptance Criteria

**Created:** February 19, 2026

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
| All services present | `$m.services.Count` | ≥ 9 |
| Each has id, type, tech_stack, port/url | `$m.services \| Select-Object id, type, tech_stack, port` | No nulls |
| Health endpoint documented | `$m.services \| Where-Object { $_.health_endpoint }` | All services |
| Status field present | `$m.services \| Select-Object id, status` | No nulls |

### Layer 1 — Personas

| Criterion | Command | Expected |
|-----------|---------|----------|
| All personas present | `$m.personas \| Select-Object id, label` | ≥ 6 |
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

| Criterion | Command | Expected |
|-----------|---------|----------|
| All 10 admin screens present | `$m.screens \| Where-Object { $_.app -eq 'admin-face' }` | 10 |
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

## End-State Acceptance (All Layers Done)

When all 11 layers are populated:

1. **Field rename in < 5 seconds**: `impact-analysis.ps1 -field key -container translations`
   returns every affected endpoint, schema, screen, and literal.

2. **No grep loops**: An agent starting fresh answers any structural question from
   `eva-model.json` alone, without reading any source file.

3. **validate-model.ps1 exits 0**: Zero schema violations, zero dangling cross-references.

4. **Same-PR rule holds**: `git log --oneline` shows no source-only commits without
   a corresponding model update.

5. **Full traceability**: `Epic-007 → REQ-012 → GET /v1/translations →
   TranslationsPage → test_get_translations_by_locale` is a single query.
