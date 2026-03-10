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
| `generate-layer-metadata-index.py` | **[AUTO]** Generate `model/layer-metadata-index.json` from Cosmos DB ground truth (runs in GitHub Actions before every deployment) |
| `generate-layer-metadata-index.ps1` | PowerShell version of metadata generator (requires Azure CLI + Key Vault access) |
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

---

## Layer Metadata Generation (Session 45 - Automated)

### Problem Solved
**Before**: `layer-metadata-index.json` was manually maintained and went out of sync with Cosmos DB. API reported 51 operational layers when Cosmos actually had 87, causing confusion about deployment success.

**After**: Metadata index is **auto-generated from Cosmos DB** before every deployment. API always returns accurate operational layer counts reflecting Cosmos reality.

### How It Works
```bash
# Automatically runs in GitHub Actions (deploy-hardened.yml, deploy-production.yml)
python scripts/generate-layer-metadata-index.py
```

**Process**:
1. Queries `/model/agent-summary` (Cosmos DB ground truth)
2. Counts objects per layer → sets `operational: true/false`
3. Preserves existing `priority`/`category` mappings
4. Generates new `model/layer-metadata-index.json`
5. Backs up old version with timestamp

**Output**: 111 total layers, 87 operational (as of March 10, 2026)

### Manual Usage
```bash
# Local testing or investigation
python scripts/generate-layer-metadata-index.py

# Review changes
git diff model/layer-metadata-index.json

# Shows new layers seeded or data added since last generation
```

### Benefits
- ✅ Always accurate (Cosmos DB is source of truth)
- ✅ Detects changes (git diff shows what's new)
- ✅ Evidence-based (no manual counting or guessing)
- ✅ Zero maintenance (runs automatically)

**See**: `scripts/README.md` in root (if moved) or workflow logs for generation output

---
