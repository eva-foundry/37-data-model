/**
 * Sprints Type Definitions
 * Layer: L27 (sprints)
 */

export interface SprintsRecord {
  id: string;
  goal?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  velocity?: number;
  project_id?: string;
  wbs_id?: string;
  layer: string;
  [key: string]: any;
}

export interface CreateSprintsRecordInput {
  id: string;
  goal?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  velocity?: number;
  project_id?: string;
  wbs_id?: string;
  [key: string]: any;
}

export interface UpdateSprintsRecordInput extends Partial<CreateSprintsRecordInput> {
  id: string;
}
