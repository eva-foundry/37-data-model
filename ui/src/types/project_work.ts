/**
 * ProjectWork Types - Generated from Data Model Layer: project_work
 */

export interface ProjectWorkRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateProjectWorkInput {
  id: string;
  [key: string]: any;
}

export interface UpdateProjectWorkInput extends Partial<CreateProjectWorkInput> {
  id: string;
}
