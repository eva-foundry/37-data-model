// Sprint types (L27 - sprints)

import type { ModelObject } from './api';

export interface SprintRecord extends ModelObject {
  // Identity
  id: string;
  label: string;
  sprint_number: number;
  
  // Project association
  project_id: string;
  
  // Timeline
  start_date: string;
  end_date: string;
  duration_weeks: number;
  
  // Status
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  
  // Work metrics
  story_count: number;
  story_points_planned: number;
  story_points_completed: number;
  velocity: number;
  
  // Context
  goal: string;
  notes: string;
}

export type SprintStatus = SprintRecord['status'];

export interface SprintFilters {
  project_id?: string;
  status?: SprintStatus;
  active_only?: boolean;
}
