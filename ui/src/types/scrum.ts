// ─── Scrum / ADO types — 37-data-model-ui ────────────────────────────────────
// Copied from 31-eva-faces/portal-face for independence
// Session 46 - Bug #2 fix
// ─────────────────────────────────────────────────────────────────────────────

export type WIState = 'Active' | 'Resolved' | 'Closed' | 'New' | 'Blocked';

export interface WorkItem {
  ado_id: number;
  wi_tag: string;
  title: string;
  sprint: string;
  state: WIState;
  dod: string;
  test_count: number | null;
  coverage_pct: number | null;
  closed_at: string | null;
  entities_affected: string[];
}

export interface Feature {
  id: number;
  title: string;
  project: string;
  work_items: WorkItem[];
}

export interface Epic {
  id: number;
  title: string;
  features: Feature[];
}

export interface ScrumDashboardResponse {
  refreshed_at: string;
  epic: Epic;
}

export type SprintBadgeState = 'Active' | 'Done' | 'Blocked';

export interface SprintSummary {
  project: string;
  sprint: string;
  badge: SprintBadgeState;
  active_count: number;
}

export interface VelocityPoint {
  sprint: string;
  tests_added: number;
  coverage_pct: number | null;
}

export type WBSNodeType = 'phase' | 'epic' | 'feature' | 'task' | 'milestone';

export interface WBSNode {
  id: string;
  parentId: string | null;
  type: WBSNodeType;
  title: string;
  owner: string | null;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Blocked';
  startDate: string | null;
  endDate: string | null;
  progress: number;
  dependencies: string[];
  children?: WBSNode[];
}

export interface WBSTreeResponse {
  nodes: WBSNode[];
}

export interface CriticalPathItem {
  id: string;
  title: string;
  duration_days: number;
  /** Reference to WBSNode.id for scroll-to */
  nodeId: string;
}

export interface CriticalPathResponse {
  total_duration_days: number;
  items: CriticalPathItem[];
}
