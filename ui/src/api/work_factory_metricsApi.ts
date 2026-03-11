/**
 * WorkFactoryMetrics API - Generated Stub
 * Layer: work_factory_metrics
 */

export interface WorkFactoryMetricsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateWorkFactoryMetricsRecordInput {
  id: string;
  [key: string]: any;
}

export const createWorkFactoryMetricsRecord = async (
  input: CreateWorkFactoryMetricsRecordInput
): Promise<WorkFactoryMetricsRecord> => {
  // Mock API call - replace with actual API implementation
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: 'work_factory_metrics',
    partition_key: input.id,
    created_at: new Date().toISOString(),
  };
};

export interface UpdateWorkFactoryMetricsRecordInput extends Partial<CreateWorkFactoryMetricsRecordInput> {
  id: string;
}

export const updateWorkFactoryMetricsRecord = async (
  input: UpdateWorkFactoryMetricsRecordInput
): Promise<WorkFactoryMetricsRecord> => {
  // Mock API call - replace with actual API implementation
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: 'work_factory_metrics',
    partition_key: input.id,
    updated_at: new Date().toISOString(),
  } as WorkFactoryMetricsRecord;
};

// COMPATIBILITY EXPORTS: singular symbols + (id, input) update signature
export type WorkFactoryMetricRecord = WorkFactoryMetricsRecord;
export type CreateWorkFactoryMetricRecordInput = CreateWorkFactoryMetricsRecordInput;
export type UpdateWorkFactoryMetricRecordInput = UpdateWorkFactoryMetricsRecordInput;

export const createWorkFactoryMetricRecord = async (
  input: CreateWorkFactoryMetricRecordInput
): Promise<WorkFactoryMetricRecord> => {
  return createWorkFactoryMetricsRecord(input as CreateWorkFactoryMetricsRecordInput) as Promise<WorkFactoryMetricRecord>;
};

export const updateWorkFactoryMetricRecord = async (
  id: string,
  input: UpdateWorkFactoryMetricRecordInput
): Promise<WorkFactoryMetricRecord> => {
  const merged = { ...(input as Record<string, any>), id } as UpdateWorkFactoryMetricsRecordInput;
  return updateWorkFactoryMetricsRecord(merged) as Promise<WorkFactoryMetricRecord>;
};
