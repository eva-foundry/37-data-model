/**
 * WorkPatternApplications Types - Generated from Data Model Layer: work_pattern_applications
 */

export interface WorkPatternApplicationsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateWorkPatternApplicationsInput {
  id: string;
  [key: string]: any;
}

export interface UpdateWorkPatternApplicationsInput extends Partial<CreateWorkPatternApplicationsInput> {
  id: string;
}
