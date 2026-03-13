/**
 * CpWorkflows Types - Generated from Data Model Layer: cp_workflows
 */

export interface CpWorkflowsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateCpWorkflowsInput {
  id: string;
  [key: string]: any;
}

export interface UpdateCpWorkflowsInput extends Partial<CreateCpWorkflowsInput> {
  id: string;
}
