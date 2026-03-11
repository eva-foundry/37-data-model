/**
 * WorkflowMetrics Types - Generated from Data Model Layer: workflow_metrics
 */

export interface WorkflowMetricsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateWorkflowMetricsInput {
  id: string;
  [key: string]: any;
}

export interface UpdateWorkflowMetricsInput extends Partial<CreateWorkflowMetricsInput> {
  id: string;
}
