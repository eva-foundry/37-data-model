/**
 * WorkflowMetrics API - Generated Stub
 * Layer: workflow_metrics
 */

export interface WorkflowMetricsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateWorkflowMetricsRecordInput {
  id: string;
  [key: string]: any;
}

export const createWorkflowMetricsRecord = async (
  input: CreateWorkflowMetricsRecordInput
): Promise<WorkflowMetricsRecord> => {
  // Mock API call - replace with actual API implementation
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: 'workflow_metrics',
    partition_key: input.id,
    created_at: new Date().toISOString(),
  };
};

export interface UpdateWorkflowMetricsRecordInput extends Partial<CreateWorkflowMetricsRecordInput> {
  id: string;
}

export const updateWorkflowMetricsRecord = async (
  input: UpdateWorkflowMetricsRecordInput
): Promise<WorkflowMetricsRecord> => {
  // Mock API call - replace with actual API implementation
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: 'workflow_metrics',
    partition_key: input.id,
    updated_at: new Date().toISOString(),
  } as WorkflowMetricsRecord;
};

// COMPATIBILITY EXPORTS: singular symbols + (id, input) update signature
export type WorkflowMetricRecord = WorkflowMetricsRecord;
export type CreateWorkflowMetricRecordInput = CreateWorkflowMetricsRecordInput;
export type UpdateWorkflowMetricRecordInput = UpdateWorkflowMetricsRecordInput;

export const createWorkflowMetricRecord = async (
  input: CreateWorkflowMetricRecordInput
): Promise<WorkflowMetricRecord> => {
  return createWorkflowMetricsRecord(input as CreateWorkflowMetricsRecordInput) as Promise<WorkflowMetricRecord>;
};

export const updateWorkflowMetricRecord = async (
  id: string,
  input: UpdateWorkflowMetricRecordInput
): Promise<WorkflowMetricRecord> => {
  const merged = { ...(input as Record<string, any>), id } as UpdateWorkflowMetricsRecordInput;
  return updateWorkflowMetricsRecord(merged) as Promise<WorkflowMetricRecord>;
};
