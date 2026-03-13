// Project portfolio types -- portal-face
// Source: PLAN.md F31-PM1, docs/ADO/20260222-pm-plane-on-faces.md
// Session 14 -- 2026-02-25 15:20 ET

export type MaturityLevel = 'idea' | 'poc' | 'active' | 'retired' | 'empty';
export type ProjectStream  = 'frontend' | 'backend' | 'infra' | 'data' | 'ai' | 'security';

export interface ProjectRecord {
  /** repo-folder id, e.g. "31-eva-faces" */
  id: string;
  name: string;
  maturity: MaturityLevel;
  stream: ProjectStream;
  /** active sprint tag, e.g. "Sprint-7"; null if not in sprint */
  sprint: string | null;
  pbi_total: number;
  pbi_done: number;
  description: string;
}

export interface ProjectListResponse {
  refreshed_at: string;
  projects: ProjectRecord[];
}
