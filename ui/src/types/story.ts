// Story types (L28 - stories)

import type { ModelObject } from './api';

export interface StoryRecord extends ModelObject {
  // Identity
  id: string;
  title: string;
  
  // Hierarchy
  project_id: string;
  sprint_id?: string;
  epic_id?: string;
  
  // Work tracking
  story_points: number;
  status: 'backlog' | 'planned' | 'in_progress' | 'completed' | 'blocked';
  priority: number;
  
  // Description
  description: string;
  acceptance_criteria: string[];
  
  // Assignment
  assigned_to?: string;
  
  // External tracking
  ado_id?: number;
  github_issue?: number;
  
  // Tags
  tags: string[];
  
  // Blocking
  blocked_by?: string[];
  blocks?: string[];
}

export type StoryStatus = StoryRecord['status'];

export interface StoryFilters {
  project_id?: string;
  sprint_id?: string;
  status?: StoryStatus;
  assigned_to?: string;
  active_only?: boolean;
}
