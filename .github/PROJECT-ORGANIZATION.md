# Project 37 (EVA Data Model) - Organization Standards

**Version**: 1.0.0  
**Established**: 2026-03-09 (Session 41 Part 8)  
**Status**: Canonical reference for folder structure and file placement

---

## Current State Assessment

**Problem**: Root directory has 150+ loose files including:
- Session reports (SESSION-*.md) mixed with permanent docs
- Deployment scripts (deploy-*.ps1) at root
- Result files (seed-result.txt, commit-result.txt, etc.)
- Ad-hoc analysis scripts (count_layers*.py, fix_*.py, analyze_*.py)
- Multiple backup folders (model-backup-*, recovery-export-*, eva-data-model-export-*)
- Log folders (workflow-logs/, logs-extracted/, .paperless-migration-logs/)
- Debug output (debug-layers-response.json, summary-debug.json)

**Solution**: Establish clear organizational structure with designated locations for each file type.

---

## Target Organization Structure

### Root Level (Keep Minimal)

**ONLY** these files belong at root:

#### Core Documentation
- `README.md` - Project overview, bootstrap sequence
- `PLAN.md` - Current plan
- `STATUS.md` - Current status
- `ACCEPTANCE.md` - Acceptance criteria
- `LICENSE` - Open source license
- `CONTRIBUTING.md` - Contribution guidelines
- `CODE_OF_CONDUCT.md` - Code of conduct
- `SECURITY.md` - Security policy
- `ARCHITECTURE.md` - High-level architecture

#### Configuration Files
- `.env` - Local environment (gitignored)
- `.env.example` - Environment template
- `.gitignore` - Git ignore rules
- `.gitattributes` - Git attributes
- `azure-pipelines.yml` - Azure DevOps pipeline
- `Dockerfile` - Container definition
- `pytest.ini` - Pytest configuration
- `requirements.txt` - Python dependencies
- `requirements-dev.txt` - Development dependencies
- `eva-factory.config.yaml` - EVA Factory configuration

#### Folders
- `api/` - FastAPI application
- `docs/` - All documentation
- `model/` - Data model JSON files (87 layers)
- `scripts/` - All operational scripts
- `tests/` - Test suite
- `evidence/` - Evidence artifacts
- `schema/` - JSON schemas
- `seed-data/` - Seed data samples
- `archives/` - Historical backups and logs
- `artifacts/` - Build/run outputs
- `.github/` - GitHub configuration
- `.vscode/` - VSCode settings
- `.venv/` - Python virtual environment (gitignored)
- `.git/` - Git repository (gitignored)

---

## Folder Structure Details

### `docs/` - Documentation Hub

```
docs/
├── library/                    # Permanent reference documentation
│   ├── README.md              # Library index
│   ├── 00-EVA-OVERVIEW.md     # EVA system overview
│   ├── 01-AGENTIC-STATE.md    # Agentic state management
│   ├── 02-ARCHITECTURE.md     # Architecture reference
│   ├── 03-DATA-MODEL-REFERENCE.md  # ★★★ 87-layer catalog (READ FIRST)
│   ├── 04-PORTAL-SCREENS.md   # Portal UI reference
│   ├── 05-GOVERNANCE-MODEL.md # Governance framework
│   ├── 06-EVA-JP-REBUILD.md   # EVA Journey Planner
│   ├── 07-PROJECT-LIFECYCLE.md # Project lifecycle
│   ├── 08-EVA-VERITAS-INTEGRATION.md # Veritas integration
│   ├── 09-EVA-ORCHESTRATOR.md # Orchestrator patterns
│   ├── 10-FK-ENHANCEMENT.md   # Foreign key validation
│   ├── 11-EVIDENCE-LAYER.md   # Evidence layer design
│   └── 12-AGENT-EXPERIENCE.md # Agent bootstrap protocol
│
├── sessions/                   # ★★★ ALL SESSION-*.md files go here
│   ├── SESSION-21-SUMMARY.md
│   ├── SESSION-26-*.md
│   ├── SESSION-27-*.md
│   ├── SESSION-30-*.md
│   ├── SESSION-39-*.md
│   ├── SESSION-40-*.md
│   └── PHASE-*.md             # Phase completion reports
│
├── architecture/               # Architecture artifacts
│   ├── diagrams/              # Architecture diagrams
│   ├── decisions/             # ADRs (Architecture Decision Records)
│   └── patterns/              # Design patterns
│
├── ADO/                        # Azure DevOps integration docs
│   └── ado-artifacts.json     # ADO artifact definitions
│
├── workflows/                  # GitHub Actions workflow docs
│   └── *.md                   # Workflow documentation
│
├── COMPLETE-51-LAYER-CATALOG.md   # ★★★ Layer status snapshot
├── REDIS-CACHE-ARCHITECTURE.md    # Redis caching design
├── FK-VALIDATION-ENHANCEMENT.md   # FK validation design
├── SEED-COSMOS-GUIDE.md           # Seeding procedures
├── CI-CD-INTEGRATION-GUIDE.md     # CI/CD setup
└── INTEGRATION-SETUP-GUIDE.md     # Integration guide
```

**Key Principles**:
- `docs/library/` = Permanent reference (READ BEFORE executing)
- `docs/sessions/` = Historical session reports (NOT at root)
- `docs/COMPLETE-51-LAYER-CATALOG.md` = Layer status (UPDATE after changes)
- `docs/library/03-DATA-MODEL-REFERENCE.md` = 87-layer reference (READ FIRST)

---

### `scripts/` - Organized by Purpose

```
scripts/
├── README.md                   # Script index and usage guide
│
├── deployment/                 # Deployment scripts
│   ├── deploy-to-msub.ps1     # Production deployment
│   ├── deploy-infrastructure.ps1
│   ├── deploy-redis-infrastructure.ps1
│   ├── deploy-*.bicep         # Bicep templates
│   └── optimize-*.ps1         # Infrastructure optimization
│
├── seed/                       # Data seeding scripts
│   ├── seed-cosmos.py         # Main seeding script
│   ├── seed-production.ps1    # Production seed orchestrator
│   ├── seed-priority1.py      # Priority 1 layers
│   ├── seed-from-plan.py      # Seed from plan
│   ├── seed-governance-from-files.py
│   └── seed-missing-projects.ps1
│
├── validation/                 # Validation scripts
│   ├── validate-model.ps1     # Model validation
│   ├── check-report.py        # Validation report generator
│   ├── validate-cloud-sync.ps1
│   ├── validate_new_projects.py
│   └── audit-*.ps1            # Audit scripts
│
├── sync/                       # Synchronization scripts
│   ├── sync-cloud-local.ps1   # Cloud ↔ Local sync
│   ├── sync-cloud-to-local.ps1
│   ├── sync-from-source.ps1
│   ├── sync-azure-infrastructure.py
│   ├── sync-azure-costs.ps1
│   ├── sync-evidence-*.py     # Evidence sync
│   └── sync-marco-inventory-to-model.py
│
├── analysis/                   # Analysis scripts
│   ├── analyze_37_data_model.py
│   ├── count_layers*.py       # Layer counting
│   ├── impact-analysis.ps1    # Impact analysis
│   ├── comprehensive-layer-audit.ps1
│   └── coverage-gaps.ps1      # Coverage analysis
│
├── debug/                      # Debug and diagnostic scripts
│   ├── debug-*.py             # Debug utilities
│   ├── diagnose-*.ps1         # Diagnostic scripts
│   ├── health-check.ps1       # Health check
│   └── readiness-probe.ps1    # Readiness probe
│
├── migration/                  # Migration scripts
│   ├── MIGRATION-CHECKLIST.md # Migration guide
│   ├── Export-PortableSecrets.ps1
│   ├── Import-PortableSecrets.ps1
│   ├── recover-*.ps1          # Recovery scripts
│   ├── restore-*.ps1          # Restore scripts
│   └── EXPORT-README.md       # Export documentation
│
├── admin/                      # Admin utilities
│   ├── dm-*.py                # Data model admin tools
│   ├── backfill-*.ps1         # Backfill scripts
│   ├── patch-*.ps1            # Patch scripts
│   ├── reflect-ids.py         # ID reflection
│   ├── register-*.ps1         # Registration scripts
│   └── grant-github-actions-permissions.ps1
│
└── testing/                    # Test utilities
    ├── test-*.py              # Test scripts
    ├── smoke_test.py          # Smoke tests
    └── test-endpoints.ps1     # Endpoint tests
```

**Access Any Script**:
```powershell
# From project root
.\scripts\seed\seed-cosmos.py
.\scripts\deployment\deploy-to-msub.ps1
.\scripts\validation\check-report.py
```

**Script Organization Rules**:
1. **NO ad-hoc scripts at root** - Always place in appropriate subfolder
2. **Name by action** - `verb-noun.ext` (seed-cosmos.py, deploy-infrastructure.ps1)
3. **Document in README.md** - Each subfolder should have usage notes
4. **Version control** - Mark breaking changes in script headers

---

### `archives/` - Historical Data

```
archives/
├── model-backups/              # Model JSON backups
│   ├── 20260306-1302/         # Timestamped backups
│   ├── 20260305/
│   └── before-recovery/
│
├── recovery-exports/           # Recovery exports
│   ├── 20260306-1302/
│   └── 20260303/
│
├── logs/                       # Historical logs
│   ├── workflow-logs/         # GitHub Actions logs
│   ├── migration-logs/        # Migration logs (e.g., .paperless-migration-logs/)
│   └── extracted-logs/        # Extracted log files
│
└── README.md                   # Archive index
```

**Archive Rules**:
1. Use ISO8601 timestamps: `YYYYMMDD-HHMM` or `YYYYMMDD`
2. Keep maximum 30 days of archives (auto-cleanup)
3. Document reason for backup in archive README.md
4. Never reference archives in active code

**Move to archives**:
- `model-backup-*` → `archives/model-backups/`
- `model-backup-before-recovery-*` → `archives/model-backups/`
- `model-archive-*` → `archives/model-backups/`
- `recovery-export-*` → `archives/recovery-exports/`
- `eva-data-model-export-*` → `archives/recovery-exports/`
- `workflow-logs/` → `archives/logs/workflow-logs/`
- `logs-extracted/` → `archives/logs/extracted-logs/`
- `.paperless-migration-logs/` → `archives/logs/migration-logs/`

---

### `artifacts/` - Build & Run Outputs

```
artifacts/
├── logs/                       # Execution logs (.txt files)
│   ├── commit-result.txt
│   ├── seed-result.txt
│   ├── validate-result.txt
│   ├── assemble-result.txt
│   ├── patch-result.txt
│   ├── prime-result.txt
│   ├── export-result.txt
│   ├── health-check.txt
│   └── *.txt                  # All *-result.txt, *-check.txt files
│
├── debug-output/               # Debug JSON/text files
│   ├── debug-layers-response.json
│   ├── summary-debug.json
│   ├── phase3-debug.txt
│   ├── probe-dpdca.txt
│   └── seed-diagnosis-report.json
│
├── reports/                    # Generated reports
│   ├── flake8-results.txt
│   ├── upload-results.log
│   ├── check-all-data-sources-results.json
│   └── sync-evidence-report.json
│
├── temp/                       # Temporary test files
│   ├── temp_test.py
│   └── test-polymorphism.py   # Ad-hoc test scripts
│
└── runs/                       # Run archives (zipped)
    ├── run-latest.zip
    ├── run-new.zip
    └── workflow-logs*.zip
```

**Artifact Rules**:
1. **DO NOT commit** - Add `artifacts/` to .gitignore
2. **Auto-cleanup** - Scripts should write here, then clean up
3. **Temporary only** - Nothing in artifacts/ is permanent
4. **Rotate logs** - Keep last 7 days only

**Move to artifacts**:
- All `*-result.txt` → `artifacts/logs/`
- All `debug-*.json` → `artifacts/debug-output/`
- All `*-debug.txt` → `artifacts/debug-output/`
- `temp_test.py` → `artifacts/temp/`
- `*.zip` (runs/logs) → `artifacts/runs/`

---

### `model/` - Data Model JSON Files

```
model/
├── layer-metadata-index.json   # Layer metadata registry
│
├── L00-L10-Application/        # Application model layers
│   ├── services.json
│   ├── personas.json
│   ├── feature_flags.json
│   ├── containers.json
│   ├── endpoints.json
│   ├── schemas.json
│   ├── screens.json
│   ├── literals.json
│   ├── agents.json
│   ├── infrastructure.json
│   └── requirements.json
│
├── L11-Observability/          # Evidence & traces
│   ├── evidence.json
│   └── traces.json
│
├── L12-L18-ControlPlane/       # Control plane layers
│   ├── cp_agents.json
│   ├── cp_policies.json
│   ├── cp_skills.json
│   └── cp_workflows.json
│
├── L19-L21-FrontendStructural/ # Frontend layers
│   ├── components.json
│   ├── hooks.json
│   └── ts_types.json
│
├── L22-L25-Catalog/            # Catalog additions
│   ├── mcp_servers.json
│   ├── prompts.json
│   ├── security_controls.json
│   └── runbooks.json
│
├── L26-L30-ProjectDPDCA/       # Project & DPDCA plane
│   ├── projects.json
│   ├── wbs.json
│   ├── sprints.json
│   ├── milestones.json
│   ├── risks.json
│   └── decisions.json
│
├── L31-L38-CICD-Testing/       # CI/CD & testing
│   ├── deployment_policies.json
│   ├── testing_policies.json
│   ├── validation_rules.json
│   ├── quality_gates.json
│   └── github_rules.json
│
├── L40-L47-Infrastructure/     # ★★★ Infrastructure monitoring (Priority 1)
│   ├── service_health_metrics.json
│   ├── resource_inventory.json
│   ├── usage_metrics.json
│   ├── cost_allocation.json
│   ├── infrastructure_events.json
│   └── azure_infrastructure.json
│
└── L48-L51-Remediation/        # Automated remediation (planned)
    └── remediation_policies.json
```

**Current State**: All 87 JSON files are flat in `model/` root.

**Option 1**: Keep flat (current state)
- ✅ Simple, no path changes
- ❌ Hard to navigate 87 files

**Option 2**: Group by layer category (recommended for future)
- ✅ Logical organization
- ✅ Easier to find related layers
- ❌ Requires path updates in code/scripts

**Decision**: Keep flat for now, but document layer groups in COMPLETE-51-LAYER-CATALOG.md.

---

## File Placement Decision Tree

**When creating/receiving a new file, ask:**

### Is it documentation?
- **Permanent reference** (architecture, data model, patterns) → `docs/library/`
- **Session report** (SESSION-*.md, PHASE-*.md) → `docs/sessions/`
- **Architecture artifact** (diagrams, ADRs) → `docs/architecture/`
- **Design doc** (Redis, FK validation) → `docs/` (root level for active designs)

### Is it a script?
- **Deployment** → `scripts/deployment/`
- **Seeding** → `scripts/seed/`
- **Validation** → `scripts/validation/`
- **Sync** → `scripts/sync/`
- **Analysis** → `scripts/analysis/`
- **Debug** → `scripts/debug/`
- **Migration** → `scripts/migration/`
- **Admin** → `scripts/admin/`
- **Testing** → `scripts/testing/`

### Is it a backup/archive?
- **Model backup** → `archives/model-backups/YYYYMMDD-HHMM/`
- **Recovery export** → `archives/recovery-exports/YYYYMMDD-HHMM/`
- **Old logs** → `archives/logs/`

### Is it build output?
- **Log file** (.txt) → `artifacts/logs/`
- **Debug output** (.json, .txt) → `artifacts/debug-output/`
- **Report** → `artifacts/reports/`
- **Temporary test** → `artifacts/temp/`

### Is it core project?
- **Data model JSON** → `model/`
- **API code** → `api/`
- **Test** → `tests/`
- **Schema** → `schema/`
- **Evidence** → `evidence/`
- **Seed data sample** → `seed-data/`

### Still unsure?
→ Ask: "Is this needed for active development?" 
   - **NO** → `archives/` or delete
   - **YES** → Find closest category above

---

## Migration Strategy

### Phase 1: Immediate (Session 41 Part 8) ✅
- [x] Document organizational standards (this file)
- [x] Update workspace copilot-instructions with fractal DPDCA
- [x] Save to agent memory for future reference

### Phase 2: Housekeeping Skill (Future Session)
**Trigger**: User invokes housekeeping skill

**Actions**:
1. Create new folders: `docs/sessions/`, `scripts/*/`, `archives/*/`, `artifacts/*/`
2. Move session reports: `SESSION-*.md` → `docs/sessions/`
3. Move scripts: By category → `scripts/*/`
4. Move backups: → `archives/`
5. Move artifacts: → `artifacts/`
6. Update `.gitignore`: Add `artifacts/`, update archive rules
7. Run validation: All imports/paths still work
8. Commit: "chore: Reorganize project structure per PROJECT-ORGANIZATION.md"

### Phase 3: Maintenance (Ongoing)
- Add pre-commit hook: Warn if files added to root
- Update templates: Scripts go in scripts/*, sessions in docs/sessions/
- Quarterly cleanup: Archives older than 30 days

---

## Agent Instructions

### When Starting ANY Session on Project 37

**STEP 1: Bootstrap from API**
```powershell
$base = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"
$guide = Invoke-RestMethod "$base/model/agent-guide"
# Now you have complete API protocol
```

**STEP 2: Read Documentation Library**
```powershell
# ALWAYS read these BEFORE executing operations:
1. docs/library/03-DATA-MODEL-REFERENCE.md   # 87-layer architecture
2. docs/COMPLETE-51-LAYER-CATALOG.md         # Current layer status
3. docs/library/12-AGENT-EXPERIENCE.md       # Agent bootstrap protocol
```

**STEP 3: Create Baseline Snapshot**
```powershell
$baseline = Invoke-RestMethod "$base/model/agent-summary"
# Save to memory - compare after operations
```

**STEP 4: Plan Per-Layer/Component**
```markdown
| Component | Current | Target | Action | Expected Δ |
|-----------|---------|--------|--------|-----------|
| layer_1   | 5       | 10     | Seed   | +5        |
```

**STEP 5: Execute Iteratively with Fractal DPDCA**
```powershell
foreach ($layer in $layers) {
    # DISCOVER: Current state
    $before = GET /model/$layer/count
    
    # DO: One layer at a time
    POST /model/admin/seed-layer -Body @{layer=$layer}
    
    # CHECK: Immediate validation
    $after = GET /model/$layer/count
    if ($after -ne $expected) { break }  # STOP on failure
    
    # ACT: Document result
    "Layer $layer: $before → $after" | Add-Content results.txt
}
```

**STEP 6: Update Documentation**
```powershell
# Update docs/COMPLETE-51-LAYER-CATALOG.md with actual results
# Add session report to docs/sessions/SESSION-XX-*.md
```

### When Creating New Files

**Scripts**:
```powershell
# Create in appropriate subfolder
New-Item scripts/seed/seed-new-layer.py
New-Item scripts/validation/validate-new-layer.ps1
New-Item scripts/deployment/deploy-new-service.ps1
```

**Session Reports**:
```powershell
# Always create in docs/sessions/
New-Item docs/sessions/SESSION-42-SUMMARY.md
```

**Archives**:
```powershell
# Timestamped folders
$timestamp = Get-Date -Format "yyyyMMdd-HHmm"
New-Item "archives/model-backups/$timestamp/" -ItemType Directory
```

### When Finding Misplaced Files

**Identify Target Location**:
1. Check decision tree above
2. Move to correct folder
3. Update any references
4. Document in commit message

---

## Enforcement & Compliance

### Pre-Commit Checks (Future)
- Warn if new files added to root (except allowed list)
- Enforce script naming convention
- Validate archive timestamps

### Periodic Audits
- **Monthly**: Review root for new loose files
- **Quarterly**: Clean archives older than 30 days
- **Session-end**: Move artifacts to permanent locations

### Exceptions
File can stay at root ONLY if:
1. Required by tooling (package.json, Dockerfile, etc.)
2. Core documentation (README.md, PLAN.md, etc.)
3. Configuration (azure-pipelines.yml, pytest.ini, etc.)

**All other files MUST** follow the organization structure.

---

## Quick Reference

### Most Common Operations

**Find layer status**:
```
→ docs/COMPLETE-51-LAYER-CATALOG.md
```

**Find layer details**:
```
→ docs/library/03-DATA-MODEL-REFERENCE.md
```

**Find deployment script**:
```
→ scripts/deployment/deploy-to-msub.ps1
```

**Find session report**:
```
→ docs/sessions/SESSION-XX-*.md
```

**Find validation script**:
```
→ scripts/validation/validate-model.ps1
```

**Find seed script**:
```
→ scripts/seed/seed-cosmos.py
```

### File Extensions Map

| Extension | Location |
|-----------|----------|
| `*.md` (session) | `docs/sessions/` |
| `*.md` (library) | `docs/library/` |
| `*.md` (design) | `docs/` |
| `*.ps1` (deploy) | `scripts/deployment/` |
| `*.ps1` (seed) | `scripts/seed/` |
| `*.ps1` (validate) | `scripts/validation/` |
| `*.py` (analysis) | `scripts/analysis/` |
| `*.py` (test) | `tests/` or `scripts/testing/` |
| `*.json` (model) | `model/` |
| `*.json` (debug) | `artifacts/debug-output/` |
| `*.txt` (log) | `artifacts/logs/` |
| `*.zip` (archive) | `artifacts/runs/` |
| `*-backup-*/` | `archives/model-backups/` |

---

**Status**: This standard is now canonical. Future housekeeping skill will enforce this structure.

**Last Updated**: 2026-03-09 (Session 41 Part 8)  
**Next Review**: After housekeeping skill implementation
