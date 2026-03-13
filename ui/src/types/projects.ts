/**
 * Projects Type Definitions
 * Layer: L25 (projects)
 */

export interface ProjectsRecord {
  id: string;
  goal: string;
  maturity: string;
  label_fr: string;
  label_en: string;
  label?: string;
  folder?: string;
  status?: string;
  category?: string;
  phase?: string;
  layer: string;
  [key: string]: any;
}

export interface CreateProjectsRecordInput {
  id: string;
  goal: string;
  maturity: string;
  label_fr: string;
  label_en: string;
  label?: string;
  folder?: string;
  status?: string;
  category?: string;
  phase?: string;
  [key: string]: any;
}

export interface UpdateProjectsRecordInput extends Partial<CreateProjectsRecordInput> {
  id: string;
}
