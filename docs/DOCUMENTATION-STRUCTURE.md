# Project 37 Documentation Structure

**Last Organized**: March 8, 2026 (Session 41 Part 3)  
**Documentation Philosophy**: Keep root clean, archive historical sessions, maintain living reference docs

---

## Root Directory (docs/)

### 📚 **Active Reference Documents**

#### Session Summaries (Current)
- **`SESSION-41-COMPLETE-SUMMARY.md`** - Session 41 complete summary (deployment + data seeding)

#### Architecture & Catalog
- **`COMPLETE-51-LAYER-CATALOG.md`** - Comprehensive catalog of all 51 layers (Session 39)
- **`TOOL-INDEX.md`** - Comprehensive tool catalog (80+ scripts) -- **CHECK THIS FIRST BEFORE CREATING TOOLS**

#### Integration & CI/CD
- **`CI-CD-INTEGRATION-GUIDE.md`** - GitHub Actions, build pipelines  
- **`INTEGRATION-SETUP-GUIDE.md`** - External system integration patterns  
- **`DOCUMENTATION-UPDATE-SUMMARY.md`** - Documentation maintenance guide  
- **`github-actions-permissions-setup.md`** - GitHub Actions RBAC setup

#### Dashboards & Queries
- **`agent-performance-dashboard.html`** - Agent metrics visualization  
- **`agent-performance-queries.md`** - KQL queries for agent telemetry

#### Temporary/Working Files
- **`governance-seed-pilot.json`** - Test governance data  
- **`tmp-agent-guide-current.json`** - Debug snapshot

#### Miscellaneous
- **`PROJECT-37-VERITAS-AUDIT-COMPLETE-20260306.md`** - EVA Veritas audit complete

---

## Subdirectories

### 📂 **library/** (Living Reference Docs)

**Purpose**: Timeless reference documentation that agents and developers consult regularly.  
**Maintenance**: **MUST be kept current** with each architectural change.

#### Current Files (12 documents):
1. **`00-EVA-OVERVIEW.md`** - Ecosystem overview, 57 projects
2. **`01-AGENTIC-STATE.md`** - Evidence-driven agent state management
3. **`02-ARCHITECTURE.md`** - Technical architecture, storage, API design
4. **`03-DATA-MODEL-REFERENCE.md`** - **ALL 51 LAYERS CATALOG** ⚠️ Update needed
5. **`04-PORTAL-SCREENS.md`** - Portal UI catalog
6. **`05-GOVERNANCE-MODEL.md`** - DPDCA governance patterns
7. **`06-EVA-JP-REBUILD.md`** - EVA JP rebuild guide
8. **`07-PROJECT-LIFECYCLE.md`** - Project lifecycle management
9. **`08-EVA-VERITAS-INTEGRATION.md`** - EVA Veritas integration patterns
10. **`09-EVA-ORCHESTRATOR.md`** - Orchestrator patterns
11. **`10-FK-ENHANCEMENT.md`** - Foreign key relationships guide
12. **`11-EVIDENCE-LAYER.md`** - Evidence Layer (L05) - competitive advantage
13. **`12-AGENT-EXPERIENCE.md`** - Agent consumption patterns

**Action Required**: Update `03-DATA-MODEL-REFERENCE.md` with all 51 layers from Session 41 population.

---

### 📂 **architecture/** (Design Decisions)

**Purpose**: Architectural design documents, enhancement plans, gap analyses.  
**Maintenance**: Archive old versions, keep current design docs.

#### Contents:
- **FK Enhancement Series** (archived from root):
  - `FK-ENHANCEMENT-BENEFIT-2026-02-28.md`
  - `FK-ENHANCEMENT-COMPLETE-PLAN-2026-02-28.md`
  - `FK-ENHANCEMENT-EXECUTION-PLAN-2026-03-01.md`
  - `FK-ENHANCEMENT-OPUS-FINDINGS-2026-02-28.md`
  - `FK-ENHANCEMENT-OPUS-REVIEW-2026-02-28.md`
  - `FK-ENHANCEMENT-RESEARCH-2026-02-28.md`

- **Evidence Layer Evolution** (archived from root):
  - `evidence-layer-enhancement-20260301.md`
  - `EVIDENCE-LAYER-EVOLUTION-GAP-ANALYSIS.md`

---

### 📂 **sessions/** (Historical Session Logs)

**Purpose**: Archive of completed session summaries and phase reports.  
**Maintenance**: Move session documents here after session completion.

#### Contents (17 session documents):
- `SESSION-21-SUMMARY.md`
- `SESSION-26-COMPLETE-PLAN.md`
- `SESSION-26-IMPLEMENTATION-SUMMARY.md`
- `SESSION-27-COMPLETE-SUMMARY.md`
- `SESSION-27-FINAL-SUMMARY.md`
- `SESSION-27-IMPLEMENTATION-SUMMARY.md`
- `SESSION-27-PART-2-SUMMARY.md`
- `SESSION-30-CLOSURE-MULTI-PROJECT.md`
- `SESSION-39-COMPLETE-SUMMARY.md`
- `SESSION-40-COMPREHENSIVE-AUDIT.md`
- `SESSION-40-FINAL-SUMMARY.md`
- `SESSION-RECORD-2026-02-27-TO-2026-03-01.md`

#### Phase Reports (archived from root):
- `PHASE-1-EVIDENCE-BACKFILL-REPORT.md`
- `PHASE-2-SYNC-AUTOMATION-COMPLETE.md`
- `PHASE-3-PORTFOLIO-CONSOLIDATION.md`

#### Debug Artifacts:
- `20260308-agent-guide-debug-plan.md`

---

### 📂 **workflows/** (Operational Workflows)

**Purpose**: Step-by-step operational procedures (deployment, backup, recovery).

---

### 📂 **ADO/** (Azure DevOps Integration)

**Purpose**: Azure DevOps specific documentation and artifacts.

---

## Documentation Maintenance Rules

### ✅ **DO**
1. **Keep SESSION-41-COMPLETE-SUMMARY.md in root** until Session 42 starts
2. **Update library/03-DATA-MODEL-REFERENCE.md** after any layer structural changes
3. **Move session summaries to sessions/** after session completion
4. **Archive old architecture docs to architecture/** after design stabilizes
5. **Check TOOL-INDEX.md** before creating any new script
6. **Update TOOL-INDEX.md** after creating/modifying scripts

### ❌ **DON'T**
1. **Don't clutter docs/ root** with temporary session files
2. **Don't keep multiple "final" summaries** for same session in root
3. **Don't let library/ docs drift** from actual implementation
4. **Don't recreate tools** that already exist in scripts/
5. **Don't archive current session summaries** until session complete

---

## Quick Reference Patterns

### "Where do I find...?"

| Need | Location |
|------|----------|
| Current session status | Root: `SESSION-41-COMPLETE-SUMMARY.md` |
| Complete tool catalog | Root: `TOOL-INDEX.md` |
| All 51 layers description | Root: `COMPLETE-51-LAYER-CATALOG.md` |
| Layer schemas and FKs | Library: `03-DATA-MODEL-REFERENCE.md` |
| Evidence Layer guide | Library: `11-EVIDENCE-LAYER.md` |
| Agent integration patterns | Library: `12-AGENT-EXPERIENCE.md` |
| Historical sessions | Sessions: `SESSION-*.md` |
| Design decisions | Architecture: `*-ENHANCEMENT-*.md` |
| Deployment procedures | Workflows: (to be organized) |

---

## Action Items (Current)

### Immediate
- [ ] Update `library/03-DATA-MODEL-REFERENCE.md` with 51 layers
  - Include all L01-L51 with schemas
  - Add FK relationships matrix
  - Add query examples for each layer

### Future
- [ ] Organize workflows/ directory with:
  - Deployment workflow
  - Backup/restore workflow
  - Layer creation workflow
  - Consistency testing workflow
  
- [ ] Create scripts/README.md with tool descriptions
  - Link to docs/TOOL-INDEX.md
  - Include usage examples

---

**Maintenance Schedule**:
- **After every session**: Move session summary to sessions/ 
- **After layer changes**: Update library/03-DATA-MODEL-REFERENCE.md
- **After tool creation**: Update TOOL-INDEX.md
- **Monthly**: Review and archive old architecture docs

**Contact**: This structure follows EVA Foundation documentation standards (Session 37, v3.4.0 template).
