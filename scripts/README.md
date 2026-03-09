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
| **`pre-commit-hook.py`** | **Auto-fix F541, Unicode before commit (local developer tool)** |
| **`install-pre-commit-hook.ps1`** | **Install pre-commit hook in .git/hooks/** |

## Quality Automation (Session 41)

**Problem**: Banal quality issues (F541 f-strings, Unicode characters) waste developer time and block PRs.

**Solution**: Three-layer automation:

1. **Local Pre-Commit Hook** (`pre-commit-hook.py`)
   - Runs before each `git commit`
   - Auto-fixes F541 and Unicode issues
   - Install: `.\scripts\install-pre-commit-hook.ps1`
   - Bypass (not recommended): `git commit --no-verify`

2. **GitHub Auto-Fix Action** (`.github/workflows/auto-fix-quality.yml`)
   - Runs on PR creation/update
   - Auto-commits fixes back to PR branch
   - Comments on PR with what was fixed

3. **Quality Gate** (`.github/workflows/quality-gates.yml`)
   - Blocks merge if fixable issues remain
   - Runs pylint, flake8, pytest

**Workspace Encoding Standard**: Never use Unicode in Python scripts — enterprise Windows cp1252 encoding causes crashes. See `.github/standards-specification.md`.
