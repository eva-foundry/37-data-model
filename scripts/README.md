# EVA Data Model — scripts/

This directory contains **model-internal** maintenance and tooling scripts only.
Scripts that read from or push data from a specific consumer repo belong in **that
repo's own `scripts/` directory**, not here.

## Convention: each app repo owns its push-to-model script

| Consumer repo | Push script | Fix script |
|---------------|-------------|------------|
| 44-eva-jp-spark | `scripts/sync-to-model.py` | `scripts/fix-model-violations.py` |
| 31-eva-faces | `scripts/sync-to-model.py` _(create when needed)_ | — |
| 33-eva-brain-v2 | `scripts/sync-to-model.py` _(create when needed)_ | — |

**Why:** if a consumer repo renames a folder, only its own script breaks. The model
repo stays generic and has no hard dependency on any consumer directory layout.

## Scripts in this directory

| Script | Purpose |
|--------|---------|
| `assemble-model.ps1` | Rebuild `model/eva-model.json` from all 27 layer JSON files |
| `validate-model.ps1` | Cross-reference validation — reports violations and warnings |
| `impact-analysis.ps1` | Show what breaks if a container / endpoint / screen changes |
| `query-model.ps1` | Interactive model query helper (offline, no API required) |
| `sync-from-source.ps1` | Pull structural metadata from source repos into JSON files |
| `coverage-gaps.ps1` | Report objects with `status=implemented` but missing `repo_line` |
| `backfill-repo-lines.py` | Stamp `repo_line` on endpoints, components, hooks, screens |
| `backfill-metadata.ps1` | Backfill `created_at/by`, `modified_at/by`, `row_version` fields |
| `ado-generate-artifacts.ps1` | Generate ADO work item import JSON from model data |
| `add-precedence-fields.ps1` | Add `precedence` / `provision_order` fields to infra objects |
