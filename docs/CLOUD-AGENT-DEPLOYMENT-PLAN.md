# Cloud Agent Deployment Plan - Session 45 Part 9

**Date**: March 11, 2026  
**Status**: Ready for GitHub Cloud Agent Deployment  
**Target**: 108 remaining layers (111 total - 3 completed)

## What We Have

### Completed Layers (3/111) ✅
- **L25 (projects)**: 6 components, 3,264 LOC, 5-language i18n
- **L26 (wbs)**: 6 components, 6,213 LOC
- **L27 (sprints)**: 6 components, 6,492 LOC
- **Total**: 18 components, 15,969 LOC

### Infrastructure Ready ✅
- **Generation Script**: `scripts/generate-screens-v2.ps1` (100% functional, 0 placeholders)
- **Templates**: 4 files with i18n support (CreateForm, EditForm, ListView, GraphView)
- **useLiterals Hook**: 160 LOC, 5-language support (EN/FR/PT/CN/ES)
- **Anti-hardcoding Test**: 180 LOC, enforces L17 literals compliance
- **Quality Gates**: TypeScript ✓, ESLint ✓, useLiterals enforcement ✓
- **Git Branch**: feat/screens-machine-poc (commit 1996001)

## Deployment Strategy

### Phase 1: Foundation Layers (L01-L24) - 24 issues
Base architecture layers (ontology, governance, project management)

**Layers**:
- L01-L12: Ontology domains (12 conceptual domains)
- L13-L24: Foundation layers (agents, tools, deployments, evidence, decisions, etc.)

### Phase 2: Extended Layers (L28-L87) - 60 issues
Extended domain layers (infrastructure, observability, execution)

**Layers**:
- L28-L46: Project execution, evidence, infrastructure
- L47-L87: Advanced features, analytics, automation

### Phase 3: Execution/Strategy Layers (L88-L111) - 24 issues
Advanced execution patterns and strategy layers (planned)

**Layers**:
- L88-L107: Execution Phase 2-4 (16 layers)
- L108-L111: Strategy layers (4 layers)

## GitHub Cloud Agent Workflow

### Per-Layer Issue Template

```markdown
Title: [Screens Machine] Generate UI components for L{id} ({layer_name})

Labels: enhancement, screens-machine, cloud-agent, automation

Assignee: @copilot

Body:

## Context
Generate 6 production-ready UI components for layer **L{id} ({layer_name})** using the Screens Machine v2 autonomous generation system.

## Pre-requisites
- Branch: `feat/screens-machine-poc`
- Script: `scripts/generate-screens-v2.ps1`
- Templates: `07-foundation-layer/templates/screens-machine/`
- Reference: L25 (projects), L26 (wbs), L27 (sprints)

## Task

### Step 1: Query Layer Schema
```powershell
$base = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"
$schema = Invoke-RestMethod "$base/model/{layer_name}/fields"
# Save to evidence/{layer_name}-schema-{timestamp}.json
```

### Step 2: Generate Components
```powershell
cd c:\eva-foundry\37-data-model
.\scripts\generate-screens-v2.ps1 -LayerId "L{id}" -LayerName "{layer_name}"
```

### Step 3: Run Quality Gates
```powershell
cd ui
npm run type-check  # Must pass (TypeScript compilation)
npm run lint        # Must pass (ESLint)
npm test            # Anti-hardcoding test (verify useLiterals usage)
```

### Step 4: Verify Output
- [ ] 6 files generated (CreateForm, EditForm, ListView, DetailDrawer, GraphView, test)
- [ ] All files use `useLiterals('{layer_name}.{component}')` hook
- [ ] No hardcoded strings (verified by anti-hardcoding test)
- [ ] TypeScript compilation passes (0 errors)
- [ ] ESLint passes (0 errors, 0 warnings)

### Step 5: Commit and PR
```powershell
git add .
git commit -m "feat(ui): Generate L{id} ({layer_name}) UI components

Session 45 Part 9 - Autonomous Screens Machine

Generated 6 components with 5-language i18n support:
- {LayerName}CreateForm.tsx
- {LayerName}EditForm.tsx
- {LayerName}ListView.tsx
- {LayerName}DetailDrawer.tsx
- {LayerName}GraphView.tsx
- {LayerName}ListView.test.tsx

Quality gates: TypeScript ✓, ESLint ✓, useLiterals ✓"

git push origin feat/screens-machine-poc
```

Create PR with title: `feat(ui): L{id} ({layer_name}) UI components`

## Success Criteria
- ✅ 6 components generated (~5,000-7,000 LOC)
- ✅ All quality gates pass (TypeScript, ESLint, anti-hardcoding)
- ✅ All components use useLiterals hook (5-language i18n)
- ✅ PR created with evidence (generation report JSON)
- ✅ 0 manual edits required (100% autonomous)

## Reference Examples
- **L25 (projects)**: [ui/src/components/projects/](c:\eva-foundry\37-data-model\ui\src\components\projects\)
- **L26 (wbs)**: [ui/src/components/wbs/](c:\eva-foundry\37-data-model\ui\src\components\wbs\)
- **L27 (sprints)**: [ui/src/components/sprints/](c:\eva-foundry\37-data-model\ui\src\components\sprints\)

## Estimated Time
30 minutes per layer (query schema 2 min + generate 5 min + quality gates 3 min + commit/PR 5 min + validation 15 min)

/cc @MarcoPresta
```

## Parallelization Strategy

### Option A: Sequential Batches (Conservative)
- Batch 1: L01-L10 (10 issues)
- Batch 2: L11-L20 (10 issues)
- Batch 3: L21-L30 (10 issues, skip L25-27 completed)
- ... Continue in batches of 10

**Timeline**: 11 batches × 2 days per batch = **22 days**

### Option B: Parallel Swarm (Aggressive)
- All 108 issues created simultaneously
- GitHub Copilot cloud agents work in parallel
- Each agent operates autonomously (query → generate → test → PR)
- PRs reviewed and merged in waves

**Timeline**: 108 layers × 30 min avg / 24 parallel workers = **~7 days**

## Quality Control

### Automated Gates
- TypeScript compilation (tsc --noEmit)
- ESLint validation (eslint src/components)
- Anti-hardcoding test (vitest anti-hardcoding.test.ts)

### Manual Review (Optional)
- Sample 10% of PRs for spot checks
- Verify component patterns match L25/L26/L27
- Confirm useLiterals hook usage

## Rollback Plan
If issues detected:
1. Stop creating new issues
2. Analyze failure pattern (schema? template? generator?)
3. Fix root cause in templates/generator
4. Regenerate failed layers
5. Resume deployment

## Success Metrics
- **Coverage**: 111/111 layers with UI components (100%)
- **LOC**: ~600,000 LOC generated (111 × ~5,500 avg)
- **Quality**: TypeScript ✓, ESLint ✓, useLiterals ✓ for all layers
- **i18n**: 27,750 translations (111 layers × 50 keys × 5 languages)
- **Time**: 7-22 days (depending on parallelization)
- **Manual Work**: < 1 hour (issue creation + final PR merge)

## Next Steps

1. **Create GitHub Issues Script** (automate 108 issue creation)
2. **Monitor Cloud Agent Progress** (track PRs, identify blockers)
3. **Review Sample PRs** (validate quality in first 10 layers)
4. **Merge Waves** (merge PRs in batches of 10-20)
5. **Celebrate 111/111** (autonomous factory operational!)

---

**Session 45 Part 9** - Cloud Agent Deployment Plan Complete
