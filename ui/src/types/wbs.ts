/**
 * WBS Type Definitions
 * Layer: L26 (wbs)
 */

export interface WBSRecord {
  id: string;
  title?: string;
  project_id?: string;
  evidence_id_pattern?: string;
  baseline_start?: string;
  done_criteria?: string;
  baseline_end?: string;
  stories_done?: number;
  points_total?: number;
  estimate_at_completion?: number;
  planned_end?: string;
  team?: string;
  deliverable?: string;
  earned_value?: number;
  actual_start?: string;
  ado_epic_id?: string;
  variance_at_completion?: number;
  sprints_planned?: number;
  depends_on_infra?: string;
  sprint_count?: number;
  notes?: string;
  ado_feature_id?: string;
  ci_runbook?: string;
  status?: string;
  layer: string;
  [key: string]: any;
}

export interface CreateWBSRecordInput {
  id: string;
  title?: string;
  project_id?: string;
  evidence_id_pattern?: string;
  baseline_start?: string;
  done_criteria?: string;
  baseline_end?: string;
  stories_done?: number;
  points_total?: number;
  estimate_at_completion?: number;
  planned_end?: string;
  team?: string;
  deliverable?: string;
  earned_value?: number;
  actual_start?: string;
  ado_epic_id?: string;
  variance_at_completion?: number;
  sprints_planned?: number;
  depends_on_infra?: string;
  sprint_count?: number;
  notes?: string;
  ado_feature_id?: string;
  ci_runbook?: string;
  status?: string;
  [key: string]: any;
}

export interface UpdateWBSRecordInput extends Partial<CreateWBSRecordInput> {
  id: string;
}
