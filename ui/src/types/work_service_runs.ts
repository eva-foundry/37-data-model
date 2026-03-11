/**
 * WorkServiceRuns Types - Generated from Data Model Layer: work_service_runs
 */

export interface WorkServiceRunsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateWorkServiceRunsInput {
  id: string;
  [key: string]: any;
}

export interface UpdateWorkServiceRunsInput extends Partial<CreateWorkServiceRunsInput> {
  id: string;
}
