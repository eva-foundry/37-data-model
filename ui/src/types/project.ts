// Project layer types (L25 - projects)

import type { ModelObject } from './api';

export interface ProjectRecord extends ModelObject {
  // Identity
  id: string;
  label: string;
  label_fr: string;
  folder: string;
  wbs_id: string;
  
  // Classification
  category: string;
  maturity: 'active' | 'poc' | 'planned' | 'archived';
  phase: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  
  // Goals & Context
  goal: string;
  notes: string;
  
  // Work Tracking
  pbi_total: number;
  pbi_done: number;
  sprint_context: string | null;
  
  // External Integrations
  ado_epic_id: number | null;
  ado_project: string;
  github_repo: string;
  
  // Dependencies & Services
  depends_on: string[];
  blocked_by: string[];
  services: string[];
}

export interface ProjectListResponse {
  refreshed_at: string;
  projects: ProjectRecord[];
}

export type ProjectMaturityLevel = ProjectRecord['maturity'];
export type ProjectStatus = ProjectRecord['status'];

/** View filters for project queries */
export interface ProjectFilters {
  category?: string;
  maturity?: ProjectMaturityLevel;
  status?: ProjectStatus;
  in_sprint?: boolean;
  is_blocked?: boolean;
  active_only?: boolean;
}
