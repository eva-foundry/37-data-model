// ─── Scrum API — 37-data-model-ui ────────────────────────────────────────────
// Self-contained implementation with mock data
// Session 46 - Bug #2/5 fix: Added fetchSprintSummaries, fetchScrumDashboard
// Future: Connect to real Data Model API
// ─────────────────────────────────────────────────────────────────────────────

import type { SprintSummary, ScrumDashboardResponse, WorkItem, Feature, Epic } from '@/types/scrum';

// Mock sprint summaries for development
const MOCK_SUMMARIES: SprintSummary[] = [
  { project: 'data-model',    sprint: 'Sprint-46', badge: 'Active',  active_count: 5 },
  { project: 'brain-v2',      sprint: 'Sprint-46', badge: 'Active',  active_count: 3 },
  { project: 'faces',         sprint: 'Sprint-46', badge: 'Active',  active_count: 8 },
  { project: 'ado-dashboard', sprint: 'Sprint-45', badge: 'Done',    active_count: 0 },
  { project: 'foundry',       sprint: 'Sprint-45', badge: 'Done',    active_count: 0 },
  { project: 'veritas',       sprint: 'Sprint-46', badge: 'Active',  active_count: 2 },
];

// Mock dashboard data
const MOCK_WORK_ITEMS: WorkItem[] = [
  {
    ado_id: 101,
    wi_tag: 'DM-001',
    title: 'Fix layerRoutes generation',
    sprint: 'Sprint-46',
    state: 'Active',
    dod: 'All 128 routes properly generated with kebab-case paths',
    test_count: 3,
    coverage_pct: 85,
    closed_at: null,
    entities_affected: ['layerRoutes.tsx', 'generate-layer-routes.ps1'],
  },
  {
    ado_id: 102,
    wi_tag: 'DM-002',
    title: 'Add missing @eva/ui components',
    sprint: 'Sprint-46',
    state: 'Active',
    dod: 'EvaInput, EvaDataGrid stubs functional',
    test_count: 2,
    coverage_pct: 90,
    closed_at: null,
    entities_affected: ['eva-ui.tsx'],
  },
];

const MOCK_FEATURE: Feature = {
  id: 1,
  title: 'Data Model UI - Screens Machine',
  project: 'data-model',
  work_items: MOCK_WORK_ITEMS,
};

const MOCK_EPIC: Epic = {
  id: 1,
  title: 'EVA Data Model Platform',
  features: [MOCK_FEATURE],
};

const MOCK_DASHBOARD: ScrumDashboardResponse = {
  refreshed_at: new Date().toISOString(),
  epic: MOCK_EPIC,
};

/**
 * Returns sprint badge summaries for product tiles.
 * Currently returns mock data. Future: Query Data Model API.
 */
export async function fetchSprintSummaries(): Promise<SprintSummary[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  return MOCK_SUMMARIES;
}

/**
 * Fetches sprint dashboard data.
 * Currently returns mock data. Future: Query Data Model API.
 */
export async function fetchScrumDashboard(
  params: { project?: string; sprint?: string } = {}
): Promise<ScrumDashboardResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  return MOCK_DASHBOARD;
}

export const scrumApi = {
  async getActiveSprints() {
    return [];
  },
  async getMetrics() {
    return {
      velocity: 0,
      burndown: 0,
      completedStories: 0,
    };
  },
};
