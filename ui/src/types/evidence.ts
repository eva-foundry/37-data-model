// Evidence types (L31 - evidence)

import type { ModelObject } from './api';

export interface EvidenceRecord extends ModelObject {
  // Identity
  id: string;
  
  // Classification
  operation: string;
  category: string;
  source: string;
  
  // Context
  project_id?: string;
  sprint_id?: string;
  story_id?: string;
  
  // Content
  description: string;
  outcome: 'success' | 'failure' | 'partial' | 'skipped';
  evidence_type: 'test' | 'deployment' | 'review' | 'audit' | 'other';
  
  // Metadata
  timestamp: string;
  duration_ms?: number;
  
  // Artifacts
  artifact_path?: string;
  artifact_size?: number;
  
  // Tags
  tags: string[];
}

export type EvidenceOutcome = EvidenceRecord['outcome'];
export type EvidenceType = EvidenceRecord['evidence_type'];

export interface EvidenceFilters {
  operation?: string;
  project_id?: string;
  outcome?: EvidenceOutcome;
  evidence_type?: EvidenceType;
  recent_hours?: number;
}
