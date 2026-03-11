/**
 * WorkOutcomes Types - Generated from Data Model Layer: work_outcomes
 */

export interface WorkOutcomesRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateWorkOutcomesInput {
  id: string;
  [key: string]: any;
}

export interface UpdateWorkOutcomesInput extends Partial<CreateWorkOutcomesInput> {
  id: string;
}
