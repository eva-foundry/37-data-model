// ─── APIM client — portal-face ───────────────────────────────────────────────
// Routes through marco-sandbox-apim (17-apim). No direct ADO calls from browser.
// Source spec: 31-eva-faces/docs/epics/eva-ado-dashboard.epic.yaml §api
// FACES-WI-A/B — mock guard active until WI-0 + WI-1 are live
// ─────────────────────────────────────────────────────────────────────────────

import type { ScrumDashboardResponse, SprintSummary, WorkItem, Feature, Epic } from '@/types/scrum';

const APIM_BASE = import.meta.env.VITE_APIM_BASE_URL ?? '';
const APIM_KEY_HEADER = 'Ocp-Apim-Subscription-Key';

/** Returns true when APIM is not configured — mock data path is active */
export const USE_MOCK = !APIM_BASE;

/** Session-scoped correlation ID (one per browser session, stable across hot-reloads) */
const SESSION_ID: string = (() => {
  const k = '_eva_session_id';
  let id = sessionStorage.getItem(k);
  if (!id) { id = crypto.randomUUID(); sessionStorage.setItem(k, id); }
  return id;
})();

function apimHeaders(): HeadersInit {
  const key   = import.meta.env.VITE_APIM_SUBSCRIPTION_KEY;
  const actor = import.meta.env.VITE_DEV_ACTOR_OID ?? 'portal-dev';
  const hdrs: Record<string, string> = {
    'X-Actor-OID':      actor,
    'X-Correlation-ID': crypto.randomUUID(),
    'X-Acting-Session': SESSION_ID,
  };
  if (key) hdrs[APIM_KEY_HEADER] = key;
  return hdrs;
}

// ─── Mock data ───────────────────────────────────────────────────────────────
// Used when VITE_APIM_BASE_URL is empty. Shapes match types exactly — no casts.

const MOCK_WORK_ITEMS: WorkItem[] = [
  {
    ado_id: 101,
    wi_tag: 'WI-0',
    title: 'eva-brain /v1/scrum/dashboard endpoint + Cosmos cache',
    sprint: 'Sprint-6',
    state: 'Active',
    dod: 'GET /v1/scrum/dashboard returns shaped ADO data; Cosmos cache TTL 86400 s verified.',
    test_count: 3,
    coverage_pct: 85,
    closed_at: null,
    entities_affected: ['ScrumCache', 'BrainRoute'],
  },
  {
    ado_id: 102,
    wi_tag: 'WI-1',
    title: 'APIM route registration for /v1/scrum/dashboard',
    sprint: 'Sprint-6',
    state: 'New',
    dod: 'Routes live in marco-sandbox-apim; subscription key auth enforced; smoke test passes.',
    test_count: null,
    coverage_pct: null,
    closed_at: null,
    entities_affected: ['ApimRoute'],
  },
  {
    ado_id: 103,
    wi_tag: 'FACES-WI-A',
    title: 'EVAHomePage — product tile grid',
    sprint: 'Sprint-6',
    state: 'Active',
    dod: 'Home page renders 23 product tiles; bilingual; WCAG 2.1 AA.',
    test_count: 5,
    coverage_pct: 90,
    closed_at: null,
    entities_affected: ['EVAHomePage', 'ProductTileGrid'],
  },
  {
    ado_id: 104,
    wi_tag: 'FACES-WI-B',
    title: 'SprintBoardPage — shell + sidebar',
    sprint: 'Sprint-6',
    state: 'New',
    dod: 'Route /devops/sprint registered; sidebar entry wired; static shell renders.',
    test_count: null,
    coverage_pct: null,
    closed_at: null,
    entities_affected: ['SprintBoardPage'],
  },
];

const MOCK_FEATURES: Feature[] = [
  {
    id: 1,
    title: 'EVA ADO Dashboard',
    project: 'ado-dashboard',
    work_items: MOCK_WORK_ITEMS,
  },
  {
    id: 2,
    title: 'EVA Brain v2 Sprint 6',
    project: 'brain-v2',
    work_items: MOCK_WORK_ITEMS.slice(0, 2),
  },
];

const MOCK_EPIC: Epic = {
  id: 4,
  title: 'EVA Platform',
  features: MOCK_FEATURES,
};

export const MOCK_DASHBOARD: ScrumDashboardResponse = {
  refreshed_at: new Date().toISOString(),
  epic: MOCK_EPIC,
};

export const MOCK_SUMMARIES: SprintSummary[] = [
  { project: 'brain-v2',      sprint: 'Sprint-6', badge: 'Active',  active_count: 2 },
  { project: 'ado-dashboard', sprint: 'Sprint-6', badge: 'Active',  active_count: 3 },
  { project: 'faces',         sprint: 'Sprint-6', badge: 'Active',  active_count: 4 },
  { project: 'foundry',       sprint: 'Sprint-5', badge: 'Done',    active_count: 0 },
  { project: 'apim',          sprint: 'Sprint-5', badge: 'Done',    active_count: 0 },
  { project: 'data-model',    sprint: 'Sprint-6', badge: 'Active',  active_count: 1 },
];

// ─── API functions ────────────────────────────────────────────────────────────

export interface DashboardParams {
  project?: string;
  sprint?: string;
}

/**
 * Fetches sprint dashboard data via APIM.
 * Falls back to MOCK_DASHBOARD when VITE_APIM_BASE_URL is empty.
 */
export async function fetchScrumDashboard(
  params: DashboardParams = {}
): Promise<ScrumDashboardResponse> {
  if (USE_MOCK) return MOCK_DASHBOARD;

  const { project = 'all', sprint = 'all' } = params;
  const url = new URL(`${APIM_BASE}/v1/scrum/dashboard`);
  url.searchParams.set('project', project);
  url.searchParams.set('sprint', sprint);

  const res = await fetch(url.toString(), { headers: apimHeaders(), cache: 'default' });

  if (!res.ok) {
    throw new Error(`[scrumApi] GET /v1/scrum/dashboard failed: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<ScrumDashboardResponse>;
}

/**
 * Returns sprint badge summaries for product tiles.
 * Degrades gracefully on failure — home page renders without badges.
 * Falls back to MOCK_SUMMARIES when VITE_APIM_BASE_URL is empty.
 */
export async function fetchSprintSummaries(): Promise<SprintSummary[]> {
  if (USE_MOCK) return MOCK_SUMMARIES;

  const url = new URL(`${APIM_BASE}/v1/scrum/summary`);

  const res = await fetch(url.toString(), { headers: apimHeaders(), cache: 'default' });

  if (!res.ok) {
    console.warn(`[scrumApi] GET /v1/scrum/summary failed: ${res.status} — badges hidden`);
    return [];
  }

  return res.json() as Promise<SprintSummary[]>;
}
