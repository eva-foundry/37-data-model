# EVA Data Model — Maintenance & Extension Phase

**Component:** 37-data-model  
**Epic type:** Maintenance / Ongoing  
**Created:** 2026-02-21  
**Status:** ✅ Onboarded to ADO — 2026-02-22  
**ADO Epic id:** 164 — https://dev.azure.com/marcopresta/eva-poc/_workitems/edit/164  
**github_repo:** eva-foundry/37-data-model  
**depends_on:** 37-data-model initial build (Epic id=30 — COMPLETE)

---

## Context

The EVA Data Model reached GA on 2026-02-20 with 11/11 layers fully populated,
`validate-model.ps1` reporting 0 violations, and all 5 scripts delivered
(assemble, validate, impact-analysis, query, sync-from-source).

The initial-build epic is in `ado-artifacts.json` at the repo root (all WIs `Done`).

This epic covers **what comes next**: the tooling, automation, and agent capabilities
that keep the model accurate as the EVA ecosystem evolves sprint over sprint.
Without these, the model drifts and loses its value within two sprints.

---

## Why This Is Different

| Dimension | Service repo (e.g. 33-eva-brain-v2) | 37-data-model |
|-----------|-------------------------------------|---------------|
| DPDCA Do phase | Implement FastAPI code | Update JSON layers + run validate-model.ps1 |
| DPDCA Act phase | pytest pass + HTTP smoke test | validate-model.ps1 exit 0 = Done |
| Deployment | Container Apps | No deploy — model files ARE the artifact |
| Test suite | pytest + coverage | validate-model.ps1 (cross-refs + schema) |
| Trigger for a sprint story | New endpoint / feature built | Source repo PR modifies a model-relevant artifact |

The DPDCA machinery (`sprint-execute.yml`) applies unchanged. The **skill set** is
`json-patch + powershell-validate` instead of `fastapi-implement + pytest + docker-push`.

---

## Problem Statement

Three gaps block the model from staying accurate without manual effort:

1. **No CI gate** — `validate-model.ps1` is not run on every PR. A source change can
   merge without a model update and no alarm fires.

2. **No drift detection** — `sync-from-source.ps1` exists but is never automatically
   triggered. Drift accumulates silently between sprint-close reviews.

3. **No coverage signal** — `coverage-gaps.ps1` is listed as `[ ]` in PLAN.md Sprint 5.
   Without it, requirements with zero test coverage are invisible.

A fourth gap exists once `29-foundry` agent is live:

4. **No model-sync agent** — when an agent adds a new endpoint in `33-eva-brain-v2`,
   it must also patch `37-data-model/model/endpoints.json`. Today that step is
   manual. A `model-sync-agent` that takes a structured diff and produces the JSON
   patch closes this loop autonomously.

---

## Epic

**Title:** EVA Data Model — Maintenance & Extension Tooling  
**Goal:** Zero-drift model — every source change that affects a model object
is automatically detected, flagged, and either auto-patched (agent path) or
surfaced as an ADO bug (manual path) — within one sprint cycle.

---

## Features

| ID | Title | Summary |
|----|-------|---------|
| dm-maint-f1 | CI Gate & Same-PR Enforcement | GitHub Actions run validate-model.ps1 on every PR; block merge if exit ≠ 0 |
| dm-maint-f2 | Automated Drift Detection | Scheduled workflow runs sync-from-source.ps1 and opens ADO bugs for drift |
| dm-maint-f3 | Coverage Gaps Script | `coverage-gaps.ps1` — list requirements with zero test_ids |
| dm-maint-f4 | Model-Sync Agent | Agent-fleet agent takes structured source diff → proposes JSON patches to model layers |

---

## Out of Scope

- Rewriting any completed model layer (L0–L10 are GA)
- Changing the `eva-model.json` schema format
- Migrating model data to a database — flat JSON files remain the source of truth
- Changes to `sprint-execute.yml` — the DPDCA contract is fixed

---

## DPDCA Session Lifecycle (for any 37-data-model WI)

When `sprint-execute.yml` fires a WI tagged `37-data-model`:

```
Define  →  read WI description + PLAN.md "Ongoing" section + current model layer JSON
Plan    →  identify which layer file(s) need updating; propose JSON patch + validate command
Do      →  apply JSON patch → run assemble-model.ps1 → run validate-model.ps1
Act     →  validate exit 0 = verdict Done
           validate exit 1 = parse violations → verdict Retry with violation list
           layer file missing = verdict Blocked (new schema needed first)
```

No HTTP health check. No docker build. The validation script is the complete acceptance gate.
