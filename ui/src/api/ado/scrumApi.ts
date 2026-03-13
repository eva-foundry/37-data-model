// ─── APIM client — GET /v1/scrum/dashboard ───────────────────────────────────
// EVA-STORY: F39-DASHBOARD-001
// EVA-STORY: F39-SUMMARY-001
// EVA-STORY: F39-01-001
// Routes through marco-sandbox-apim (17-apim). No direct ADO calls from browser.
// Generated: 2026-02-20 10:55 ET

import type {
  ScrumDashboardResponse,
  SprintSummary,
  VelocityPoint,
} from "../types/scrum";

// APIM base URL injected via env at build time (Vite convention)
const APIM_BASE = import.meta.env.VITE_APIM_BASE_URL ?? "";

// Data Model API base URL (Session 26 agent experience enhancements)
const DATA_MODEL_BASE = import.meta.env.VITE_DATA_MODEL_BASE_URL ?? 
  "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io";

/** Subscription key header name expected by marco-sandbox-apim */
const APIM_KEY_HEADER = "Ocp-Apim-Subscription-Key";

function apimHeaders(): HeadersInit {
  const key = import.meta.env.VITE_APIM_SUBSCRIPTION_KEY;
  return key ? { [APIM_KEY_HEADER]: key } : {};
}

// ─── /v1/scrum/dashboard ─────────────────────────────────────────────────────

export interface DashboardParams {
  /** "all" | "brain-v2" | "faces" | "agents" | ... */
  project?: string;
  /** "all" | "Sprint-6" | "Sprint-5" | ... */
  sprint?: string;
}

/**
 * Fetches sprint dashboard data from 33-eva-brain-v2 via 17-apim.
 * Cosmos cache TTL = 24 h; cache key = {project}-{sprint}.
 */
export async function fetchScrumDashboard(
  params: DashboardParams = {}
): Promise<ScrumDashboardResponse> {
  const { project = "all", sprint = "all" } = params;
  const url = new URL(`${APIM_BASE}/v1/scrum/dashboard`);
  url.searchParams.set("project", project);
  url.searchParams.set("sprint", sprint);

  const res = await fetch(url.toString(), {
    headers: apimHeaders(),
    cache: "default",
  });

  if (!res.ok) {
    throw new Error(
      `[scrumApi] GET /v1/scrum/dashboard failed: ${res.status} ${res.statusText}`
    );
  }

  return res.json() as Promise<ScrumDashboardResponse>;
}

// ─── /v1/scrum/summary (sprint badges for product tiles) ─────────────────────

/**
 * Returns a lightweight summary array used to populate sprint badges on product tiles.
 * Maps to the same eva-brain endpoint with reduced projection.
 */
export async function fetchSprintSummaries(): Promise<SprintSummary[]> {
  const url = new URL(`${APIM_BASE}/v1/scrum/summary`);

  const res = await fetch(url.toString(), {
    headers: apimHeaders(),
    cache: "default",
  });

  if (!res.ok) {
    // Degrade gracefully — home page renders without badges
    console.warn(
      `[scrumApi] GET /v1/scrum/summary failed: ${res.status} — badges will be hidden`
    );
    return [];
  }

  return res.json() as Promise<SprintSummary[]>;
}

// ─── Evidence-based velocity (data model API, Session 26) ────────────────────

export interface EvidenceAggregation {
  total: number;
  groups: Array<{
    group_key: string;
    count: number;
    avg_test_count?: number;
    avg_coverage_pct?: number;
  }>;
}

export interface ProjectMetricsTrend {
  project_id: string;
  by_sprint: Array<{
    sprint_id: string;
    evidence_count: number;
    avg_test_count: number | null;
    avg_coverage_pct: number | null;
    phases: Record<string, number>;
  }>;
}

/**
 * Fetches evidence-based velocity metrics for a project.
 * Replaces client-side aggregation with server-side data model API.
 * Session 26: /model/projects/{id}/metrics/trend
 */
export async function fetchProjectMetricsTrend(
  projectId: string
): Promise<VelocityPoint[]> {
  const url = `${DATA_MODEL_BASE}/model/projects/${projectId}/metrics/trend`;

  try {
    const res = await fetch(url, { cache: "default" });

    if (!res.ok) {
      console.warn(
        `[scrumApi] GET /model/projects/${projectId}/metrics/trend failed: ${res.status} — falling back to client-side`
      );
      return [];
    }

    const trend: ProjectMetricsTrend = await res.json();

    // Transform to VelocityPoint array
    return trend.by_sprint.map((s) => ({
      sprint: s.sprint_id,
      tests_added: s.avg_test_count ?? 0,
      coverage_pct: s.avg_coverage_pct,
    }));
  } catch (error) {
    console.error(
      `[scrumApi] Failed to fetch metrics trend for ${projectId}:`,
      error
    );
    return [];
  }
}

/**
 * Fetches aggregated evidence metrics with group_by and metrics parameters.
 * Session 26: /model/evidence/aggregate
 */
export async function fetchEvidenceAggregate(params: {
  group_by?: string;
  metrics?: string;
  project_id?: string;
  sprint_id?: string;
}): Promise<EvidenceAggregation | null> {
  const url = new URL(`${DATA_MODEL_BASE}/model/evidence/aggregate`);
  if (params.group_by) url.searchParams.set("group_by", params.group_by);
  if (params.metrics) url.searchParams.set("metrics", params.metrics);
  if (params.project_id) url.searchParams.set("project_id", params.project_id);
  if (params.sprint_id) url.searchParams.set("sprint_id", params.sprint_id);

  try {
    const res = await fetch(url.toString(), { cache: "default" });

    if (!res.ok) {
      console.warn(
        `[scrumApi] GET /model/evidence/aggregate failed: ${res.status}`
      );
      return null;
    }

    return res.json() as Promise<EvidenceAggregation>;
  } catch (error) {
    console.error(`[scrumApi] Failed to fetch evidence aggregate:`, error);
    return null;
  }
}
