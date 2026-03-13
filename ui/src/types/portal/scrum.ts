// ─── Scrum / ADO types — portal-face ─────────────────────────────────────────
// Reimplemented from 39-ado-dashboard spec (no import — no-import architecture).
// Canonical shape source: 31-eva-faces/docs/epics/eva-ado-dashboard.epic.yaml §api
// Last synced: 2026-02-20
// ─────────────────────────────────────────────────────────────────────────────

// ─── Work Item ───────────────────────────────────────────────────────────────

export type WIState = 'Active' | 'Resolved' | 'Closed' | 'New' | 'Blocked';

export interface WorkItem {
  /** ADO work item numeric id */
  ado_id: number;
  /** Human-readable tag, e.g. "WI-7" */
  wi_tag: string;
  title: string;
  sprint: string;
  state: WIState;
  /** Definition of Done — plain text */
  dod: string;
  test_count: number | null;
  coverage_pct: number | null;
  closed_at: string | null; // ISO-8601
  /** e.g. ["ScrumContext", "BrainRoute"] */
  entities_affected: string[];
}

// ─── Feature ─────────────────────────────────────────────────────────────────

export interface Feature {
  id: number;
  title: string;
  /** slug matching APIM project filter param, e.g. "brain-v2" */
  project: string;
  work_items: WorkItem[];
}

// ─── Epic ────────────────────────────────────────────────────────────────────

export interface Epic {
  id: number;
  title: string;
  features: Feature[];
}

// ─── Dashboard response ───────────────────────────────────────────────────────

export interface ScrumDashboardResponse {
  /** ISO-8601 timestamp of last ADO sync */
  refreshed_at: string;
  epic: Epic;
}

// ─── Sprint summary (product tile badges) ────────────────────────────────────

export type SprintBadgeState = 'Active' | 'Done' | 'Blocked';

export interface SprintSummary {
  project: string;
  sprint: string;
  badge: SprintBadgeState;
  /** Count of Active WIs in this sprint for this project */
  active_count: number;
}

// ─── Product tile definition ──────────────────────────────────────────────────

export type ProductCategory =
  | 'User Products'
  | 'AI Intelligence'
  | 'Platform'
  | 'Developer'
  | 'Moonshot';

export interface Product {
  id: string;
  /** Display name — bilingual tuple [EN, FR] */
  name: [string, string];
  category: ProductCategory;
  /** slug matching APIM project param; null if no ADO project yet */
  adoProject: string | null;
  /** Route inside eva-faces or absolute URL */
  href: string;
  /** Emoji or GC icon identifier */
  icon: string;
}

// ─── Velocity data point ─────────────────────────────────────────────────────

export interface VelocityPoint {
  sprint: string;
  tests_added: number;
  coverage_pct: number | null;
}

// ─── WBS (Work Breakdown Structure) -- F31-PM2 ────────────────────────────────

export type WBSNodeType = 'phase' | 'epic' | 'feature' | 'task' | 'milestone';

export interface WBSNode {
  id: string;
  parent_id: string | null;
  type: WBSNodeType;
  title: string;
  /** 0 = root phase, 1 = epic, 2 = feature, etc. */
  level: number;
  /** Phase gate locked -- shows lock icon + tooltip */
  is_locked: boolean;
  sprint: string | null;
}

export interface WBSTreeResponse {
  project_id: string;
  refreshed_at: string;
  /** Flat list; build hierarchy from parent_id */
  nodes: WBSNode[];
}

export interface CriticalPathItem {
  wi_tag: string;
  title: string;
  sprint: string | null;
  is_gate_passing: boolean;
  /** Reference to WBSNode.id for scroll-to */
  node_id: string;
}

export interface CriticalPathResponse {
  project_id: string;
  refreshed_at: string;
  items: CriticalPathItem[];
}
