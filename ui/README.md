# EVA Data Model - Views Library

**Version**: 1.0.0  
**Purpose**: Context-aware query wrappers for EVA Data Model API with fire-hose protection  
**Pattern**: Inspired by Siebel Systems views architecture

---

## Problem Statement

The Data Model API provides raw access to 111 layers (87 operational). Querying `/model/projects/` returns all 56 projects with no context - a "fire hose" that overwhelms agents and UI components.

**Views solve this** by providing named, context-aware query functions that return filtered, meaningful subsets of data.

---

## Architecture

```
Data Model API (fire hose - no filters)
    ↓
Views Library (smart client-side filtering, context-aware queries)
    ↓
UI Components (consume views, never raw API)
```

---

## Usage

### Install

```bash
cd 37-data-model/ui
npm install
```

### Basic Usage

```typescript
import { getActiveProjects, getDefaultSprints } from '@/lib/views';

// Get active projects only (not all 56)
const projects = await getActiveProjects();

// Get current sprint
const sprint = await getCurrentSprint('37-data-model');

// Get recent evidence (last 24 hours)
const evidence = await getRecentEvidence(24);
```

### Advanced Filtering

```typescript
import { getProjects, getEndpoints } from '@/lib/views';

// Multi-filter projects
const projects = await getProjects({
  category: 'Platform',
  maturity: 'active',
  in_sprint: true,
  active_only: true
});

// Operational endpoints only
const endpoints = await getEndpoints({
  status: 'implemented',
  service: 'data-model'
});
```

---

## Available Views

### Projects (L25)

| View | Description | Fire-Hose Protection |
|------|-------------|---------------------|
| `getDefaultProjects()` | **Recommended** - Active projects only | 56 → ~40 |
| `getActiveProjects()` | is_active=true, status=active | 56 → ~40 |
| `getOperationalProjects()` | maturity=active | 56 → ~35 |
| `getPocProjects()` | maturity=poc | 56 → ~15 |
| `getProjectsInSprint()` | sprint_context !== null | 56 → ~12 |
| `getBlockedProjects()` | blocked_by.length > 0 | 56 → ~3 |
| `getProjectsByCategory(cat)` | Filter by category | 56 → ~8 |
| `getCurrentWorkspaceProjects(path)` | Filter by workspace folder | 56 → ~10 |

### Sprints (L27)

| View | Description |
|------|-------------|
| `getDefaultSprints()` | Active sprints only |
| `getActiveSprints()` | status=active |
| `getCurrentSprint(projectId?)` | Most recent active sprint |
| `getSprintsByProject(id)` | Filter by project FK |
| `getCompletedSprints(projectId?)` | Historical sprints |

### Evidence (L31)

| View | Description |
|------|-------------|
| `getDefaultEvidence()` | Last 24 hours |
| `getRecentEvidence(hours)` | Last N hours, sorted desc |
| `getEvidenceByOperation(op)` | Filter by operation type |
| `getEvidenceByProject(id)` | Filter by project FK |
| `getFailedEvidence()` | outcome=failure |
| `getSuccessfulEvidence()` | outcome=success |

### Endpoints (L11)

| View | Description |
|------|-------------|
| `getDefaultEndpoints()` | Operational endpoints only |
| `getOperationalEndpoints()` | status=implemented\|coded |
| `getStubEndpoints()` | status=stub |
| `getEndpointsByService(svc)` | Filter by service |
| `getEndpointsByMethod(method)` | Filter by HTTP method |
| `getAuthenticatedEndpoints()` | auth.length > 0 |

### Stories (L28)

| View | Description |
|------|-------------|
| `getDefaultStories()` | Active stories |
| `getActiveStories()` | status=in_progress |
| `getStoriesByProject(id)` | Filter by project FK |
| `getStoriesBySprint(id)` | Filter by sprint FK |
| `getBlockedStories()` | status=blocked or blocked_by.length > 0 |
| `getBacklogStories(projectId?)` | status=backlog |

---

## Design Principles

1. **Default Views Recommended**: Every layer has a `getDefault*()` view that returns the most useful subset
2. **Fire-Hose Protection**: Never return unfiltered data to UI components
3. **Context-Aware**: Views understand FK relationships, time ranges, workspace context
4. **Named Intent**: View names document "why" you're querying (getActiveProjects vs getAllProjects)
5. **Client-Side Filtering**: API has no filter support - Views handle it intelligently
6. **Type-Safe**: Full TypeScript types for all records and filters

---

## Extending Views

To add a new layer:

1. **Create type**: `ui/src/types/{layer}.ts`
   ```typescript
   export interface MyLayerRecord extends ModelObject {
     id: string;
     // layer-specific fields
   }
   ```

2. **Create views**: `ui/src/lib/views/{layer}.ts`
   ```typescript
   export async function getDefaultMyLayer(): Promise<MyLayerRecord[]> {
     const all = await apiClient.query<MyLayerRecord>('my_layer', { limit: 500 });
     return all.data.filter(/* context-aware filter */);
   }
   ```

3. **Export**: Add to `ui/src/lib/views/index.ts`

---

## Implementation Notes

- **Base Client**: `lib/api/client.ts` handles all HTTP communication
- **Fire-Hose Limit**: Default `limit=100`, increase cautiously per layer
- **Response Structure**: All endpoints return `{ data: [...], _pagination: {...} }`
- **Error Handling**: Views use try/catch, return `undefined` for missing objects
- **Sorting**: Most views sort results (e.g., evidence by timestamp desc)

---

## Factory Integration

The Screens Machine templates will use Views exclusively:

```typescript
// OLD (fire hose):
const records = await fetch('/model/projects/').then(r => r.json());

// NEW (Views):
import { getDefaultProjects } from '@/lib/views';
const records = await getDefaultProjects();
```

This ensures generated UI components never overwhelm users with unfiltered data.

---

## Evidence

- **Created**: 2026-03-11 00:15 ET (Session 45 Part 5)
- **Pattern Source**: Siebel Systems views architecture
- **Layers Implemented**: 5 (projects, sprints, evidence, endpoints, stories)
- **Total Files**: 14 (5 types + 5 views + client + index + package + tsconfig + README)
- **Lines of Code**: ~1,200
- **Fire-Hose Reduction**: 56 projects → 8-40 (context-dependent)

---

*For questions, see [37-data-model/USER-GUIDE.md](../USER-GUIDE.md) or [Factory Architecture](../../docs/ARCHITECTURE/EVA-AUTONOMOUS-FACTORY.md)*
