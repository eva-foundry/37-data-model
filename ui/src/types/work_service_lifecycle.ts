/**
 * WorkServiceLifecycle Types - Generated from Data Model Layer: work_service_lifecycle
 */

export interface WorkServiceLifecycleRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateWorkServiceLifecycleInput {
  id: string;
  [key: string]: any;
}

export interface UpdateWorkServiceLifecycleInput extends Partial<CreateWorkServiceLifecycleInput> {
  id: string;
}
