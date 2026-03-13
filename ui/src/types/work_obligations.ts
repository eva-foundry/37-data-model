/**
 * WorkObligations Types - Generated from Data Model Layer: work_obligations
 */

export interface WorkObligationsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateWorkObligationsInput {
  id: string;
  [key: string]: any;
}

export interface UpdateWorkObligationsInput extends Partial<CreateWorkObligationsInput> {
  id: string;
}
