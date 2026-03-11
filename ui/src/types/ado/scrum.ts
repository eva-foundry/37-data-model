// ─── Scrum / ADO shared types for 39-ado-dashboard ───────────────────────────
// Generated: 2026-02-20 10:55 ET

// ─── Work Item ───────────────────────────────────────────────────────────────

export type WIState = "Active" | "Resolved" | "Closed" | "New" | "Blocked";

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

// ─── Sprint summary (used for product tile badges) ────────────────────────────

export type SprintBadgeState = "Active" | "Done" | "Blocked";

export interface SprintSummary {
  project: string;
  sprint: string;
  badge: SprintBadgeState;
  /** Count of Active WIs in this sprint for this project */
  active_count: number;
}

// ─── Product tile definition ──────────────────────────────────────────────────

export type ProductCategory =
  | "User Products"
  | "AI Intelligence"
  | "Platform"
  | "Developer"
  | "Moonshot";

export interface Product {
  id: string;
  /** Display name — bilingual tuple [EN, FR] */
  name: [string, string];
  category: ProductCategory;
  /** e.g. "brain-v2" — matches APIM project param; null if no ADO project yet */
  adoProject: string | null;
  /** Route inside eva-faces or absolute URL */
  href: string;
  /** Icon identifier (GC Design System icon name or URL) */
  icon: string;
}

// ─── Velocity data point ─────────────────────────────────────────────────────

export interface VelocityPoint {
  sprint: string;
  tests_added: number;
  coverage_pct: number | null;
}
