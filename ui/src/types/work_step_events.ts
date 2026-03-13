/**
 * WorkStepEvents Types - Generated from Data Model Layer: work_step_events
 */

export interface WorkStepEventsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateWorkStepEventsInput {
  id: string;
  [key: string]: any;
}

export interface UpdateWorkStepEventsInput extends Partial<CreateWorkStepEventsInput> {
  id: string;
}
