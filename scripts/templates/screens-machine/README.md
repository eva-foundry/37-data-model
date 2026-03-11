# Screens Machine Templates

**Version**: 1.0.0  
**Date**: March 10, 2026  
**Session**: 45 (Part 4 - Factory Implementation)

## Overview

Templates for autonomous UI generation across all 111 Data Model layers. Based on proven patterns from Project 31 (EVA Faces) and workspace-wide React standards.

## Template Structure

### 5 Core Component Types

1. **ListView** - Grid/list display with filters (e.g., ProjectPortfolioPage)
2. **DetailView** - Slide-in drawer with full record details (e.g., WIDetailDrawer)
3. **CreateForm** - Form for creating new records
4. **EditForm** - Form for editing existing records
5. **GraphView** - Data visualization (charts, graphs, network diagrams)

### Supporting Files

- **test.spec.tsx.template** - Jest/Testing Library unit tests
- **evidence.json.template** - Generation evidence metadata

## Template Variables

All templates use Mustache-style placeholders:

| Variable | Example | Description |
|----------|---------|-------------|
| `{{LAYER_ID}}` | `L25` | Data Model layer ID |
| `{{LAYER_NAME}}` | `projects` | Layer name (snake_case) |
| `{{LAYER_TITLE}}` | `Projects` | Human-readable title |
| `{{LAYER_TITLE_FR}}` | `Projets` | French title |
| `{{ENTITY_TYPE}}` | `ProjectRecord` | TypeScript interface name |
| `{{FIELDS}}` | JSON array | Field definitions with types |
| `{{PK_FIELD}}` | `id` | Primary key field |
| `{{DESCRIPTION}}` | `...` | Layer description |
| `{{TIMESTAMP}}` | ISO 8601 | Generation timestamp |
| `{{GENERATOR}}` | `screens-machine-v1` | Generation tool identifier |

## Field Schema Format

```json
{
  "name": "id",
  "type": "string",
  "required": true,
  "pk": true,
  "description": "Unique project identifier"
}
```

## Technology Stack

- **Framework**: React 18+ (functional components)
- **Language**: TypeScript 5+
- **Styling**: Inline styles (GC Design System colors)
- **Testing**: Jest + Testing Library
- **Accessibility**: WCAG 2.1 Level AA
- **i18n**: Bilingual (en/fr)

## Design System Colors

```typescript
const GC_TEXT    = '#0b0c0e';  // Primary text
const GC_MUTED   = '#505a5f';  // Secondary text
const GC_BORDER  = '#b1b4b6';  // Borders
const GC_SURFACE = '#f8f8f8';  // Background
const GC_BLUE    = '#1d70b8';  // Primary action
const GC_ERROR   = '#d4351c';  // Error state
const GC_SUCCESS = '#00703c';  // Success state
```

## Usage Pattern

### 1. Query Data Model API

```powershell
$layer = Invoke-RestMethod "https://msub-eva-data-model.../model/objects/raw?layer=L25&limit=1"
$schema = $layer.schema
```

### 2. Apply Template

```powershell
$component = Get-Content "ListView.template.tsx" -Raw
$component = $component -replace '{{LAYER_ID}}', 'L25'
$component = $component -replace '{{LAYER_NAME}}', 'projects'
# ... (all variables)
```

### 3. Write Output

```powershell
$outputPath = "src/pages/$LayerName/$LayerNameListPage.tsx"
Set-Content -Path $outputPath -Value $component -Encoding UTF8
```

### 4. Generate Evidence

```json
{
  "operation": "screen_generation",
  "layer_id": "L25",
  "layer_name": "projects",
  "component_type": "ListView",
  "timestamp": "2026-03-10T02:30:00Z",
  "generator": "screens-machine-v1.0.0",
  "field_count": 8,
  "lines_of_code": 234,
  "test_coverage": "100%"
}
```

## Quality Gates

All generated components must pass:

1. **TypeScript compilation** (tsc --noEmit)
2. **ESLint** (no errors, warnings acceptable)
3. **Jest tests** (100% coverage for generated code)
4. **Playwright E2E** (smoke test: renders without crash)
5. **Accessibility** (axe-core audit)

## Reference Implementation

See [Project 31 (EVA Faces)](../../31-eva-faces/) for:
- `portal-face/src/pages/ProjectPortfolioPage.tsx` - ListView pattern
- `portal-face/src/components/WIDetailDrawer.tsx` - DetailView pattern
- `portal-face/src/components/ProjectCard.tsx` - Card component pattern

## Factory Integration

These templates feed into:
- GitHub Workflow: `.github/workflows/screens-machine.yml`
- Orchestration: Sequential (L1→L111) or Parallel (all 111 simultaneously)
- Quality Gate: MTI score > 70 (Project 48 Veritas)
- Evidence: Written to `evidence/screen-generation-{layer_id}.json`

## Next Steps

1. Create all 5 core templates
2. Create test + evidence templates
3. Generate 3 POC screens (L25, L26, L27)
4. Measure: time per layer, LOC, test coverage
5. Create GitHub workflow
6. Assign first persistent issue to @copilot

---

*Session 45 Part 4 - EVA Autonomous Software Factory*
