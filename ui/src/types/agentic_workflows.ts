/**
 * AgenticWorkflows Types - Generated from Data Model Layer: agentic_workflows
 */

export interface AgenticWorkflowsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateAgenticWorkflowsInput {
  id: string;
  [key: string]: any;
}

export interface UpdateAgenticWorkflowsInput extends Partial<CreateAgenticWorkflowsInput> {
  id: string;
}
