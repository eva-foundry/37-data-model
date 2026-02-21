# EVA Data Model — GitHub Copilot Instructions

<!-- 
  AUTO-LOADED by VS Code Copilot at every session start for this workspace.
  These rules apply to any agent reading or writing the EVA Data Model.
  Model declared GA: 2026-02-20T05:01:00-05:00
-->

> **Model is complete: 11/11 layers · PASS 0 violations**  
> See [USER-GUIDE.md](../USER-GUIDE.md) for query examples and agent skill patterns.  
> See [ANNOUNCEMENT.md](../ANNOUNCEMENT.md) for accuracy boundaries.

---

## What This Repository Is

`37-data-model` is the **semantic object model for the entire EVA ecosystem**.
It is the machine-queryable equivalent of a Siebel repository — every significant
object (service, persona, container, endpoint, screen, literal, agent, requirement)
is a typed node with explicit FK-style cross-references.

**Read `eva-model.json` before reading any source file.**

---

## Bootstrap (every session)

```powershell
# 1. Load the assembled model
$m = Get-Content C:\AICOE\eva-foundation\37-data-model\model\eva-model.json | ConvertFrom-Json

# 2. Check layer completeness
$m.meta | Select-Object last_updated, layers_complete, total_layers

# 3. Run validation
C:\AICOE\eva-foundation\37-data-model\scripts\validate-model.ps1
```

If `validate-model.ps1` reports violations → **fix them before doing any other work**.
A model with dangling references is worse than no model.

---

## Canonical Queries

```powershell
# What services exist?
$m.services | Select-Object id, type, port, status

# What can persona 'admin' access?
$m.personas | Where-Object { $_.id -eq 'admin' } | Select-Object -ExpandProperty feature_flags

# What does GET /v1/translations return?
$m.endpoints | Where-Object { $_.id -eq 'GET /v1/translations' } |
  Select-Object response_schema, cosmos_reads, auth

# What screens call GET /v1/translations?
$m.screens | Where-Object { $_.api_calls -contains 'GET /v1/translations' } |
  Select-Object id, route, status

# What literals does TranslationsPage use?
$m.literals | Where-Object { $_.screens -contains 'TranslationsPage' } |
  Select-Object key, default_en, default_fr

# Field rename impact: what breaks if 'key' renamed in translations container?
$affected_eps = $m.endpoints | Where-Object { $_.cosmos_reads -contains 'translations' -or $_.cosmos_writes -contains 'translations' }
$affected_sc  = $m.screens   | Where-Object { ($_.api_calls | ForEach-Object { $_ -in $affected_eps.id }) -contains $true }
"Endpoints: $($affected_eps.Count)  Screens: $($affected_sc.Count)"
```

---

## Writing Rules

### When to update the model

The model is updated **in the same commit that changes the source**. Never defer.

| Source change | Model update |
|---------------|-------------|
| New endpoint | `endpoints.json` + `schemas.json` for new response shape |
| New Pydantic model | `schemas.json` |
| New Cosmos container | `containers.json` |
| New React screen | `screens.json` + `literals.json` for all new string keys |
| New persona | `personas.json` + `feature_flags.json` |
| New feature flag | `feature_flags.json` |
| New agent | `agents.json` |
| New Azure resource | `infrastructure.json` |

### Validation gate

Before marking any layer complete:
```powershell
scripts/validate-model.ps1
```
Must exit 0. Zero dangling references. Zero schema violations.

### Assemble after every update

After editing any layer file:
```powershell
scripts/assemble-model.ps1
```
This regenerates `model/eva-model.json`. Never hand-edit `eva-model.json` directly.

---

## Schema Discipline

Every object in every layer file must conform to its JSON Schema in `schema/`.

Required fields that can NEVER be null:
- All objects: `id`, `status`
- endpoints: `method`, `path`, `auth`, `feature_flag`, `cosmos_reads`, `cosmos_writes`
- screens: `app`, `route`, `api_calls`, `components`
- literals: `key`, `default_en`, `default_fr`, `screens`
- containers: `partition_key`, `fields`

Optional fields that must be `null` (never omitted):
- `endpoint.request_schema` — null if no request body
- `screen.notes` — null if no caveats

---

## Cross-Reference Integrity Rules

1. Every `endpoint.cosmos_reads[]` value must be an `id` in `containers.json`
2. Every `endpoint.cosmos_writes[]` value must be an `id` in `containers.json`
3. Every `endpoint.feature_flag` must be an `id` in `feature_flags.json`
4. Every `endpoint.auth[]` value must be an `id` in `personas.json`
5. Every `screen.api_calls[]` value must be an `id` in `endpoints.json`
6. Every `literal.screens[]` value must be an `id` in `screens.json`
7. Every `requirement.satisfied_by[]` value must resolve to endpoint or screen id
8. Every `agent.output_screens[]` value must be an `id` in `screens.json`

Violations are reported by `scripts/validate-model.ps1`.

---

## Anti-Patterns

| Do NOT do this | Do this instead |
|----------------|-----------------|
| Run file_search to find all endpoints | `$m.endpoints \| Select-Object id, path` |
| grep source files for Cosmos container names | `$m.containers \| Select-Object id` |
| Read all route files to build impact analysis | `scripts/impact-analysis.ps1 -field <name>` |
| Hand-edit `eva-model.json` | Edit the layer file, then run `assemble-model.ps1` |
| Defer model update to next session | Update in same commit as source change |
| Add an endpoint to the model with `cosmos_reads: []` | Read the route handler, fill in actual containers |

---

## Layer Status Reference

Check `STATUS.md` for current layer completeness before any query.
If a layer is NOT STARTED, fall back to reading source files for that layer.
If a layer is COMPLETE, the model is authoritative — do not re-read source.

---

## Relationship to Other repositories

- `33-eva-brain-v2/docs/artifacts.json` — file registry (one service) → cross-ref `endpoint.implemented_in`
- `31-eva-faces/EVA-FACES-MASTER-TRACKER.md` — implementation status cross-ref `screen.status`
- `33-eva-brain-v2/.github/copilot-instructions.md` — service-level coding rules (still apply)
- This file governs model reads/writes only; coding conventions remain in service repos
