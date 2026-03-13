/**
 * UsageMetrics API - Generated Stub
 * Layer: usage_metrics
 */

export interface UsageMetricsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateUsageMetricsRecordInput {
  id: string;
  [key: string]: any;
}

export const createUsageMetricsRecord = async (
  input: CreateUsageMetricsRecordInput
): Promise<UsageMetricsRecord> => {
  // Mock API call - replace with actual API implementation
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: 'usage_metrics',
    partition_key: input.id,
    created_at: new Date().toISOString(),
  };
};

export interface UpdateUsageMetricsRecordInput extends Partial<CreateUsageMetricsRecordInput> {
  id: string;
}

export const updateUsageMetricsRecord = async (
  input: UpdateUsageMetricsRecordInput
): Promise<UsageMetricsRecord> => {
  // Mock API call - replace with actual API implementation
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: 'usage_metrics',
    partition_key: input.id,
    updated_at: new Date().toISOString(),
  } as UsageMetricsRecord;
};

// COMPATIBILITY EXPORTS: singular symbols + (id, input) update signature
export type UsageMetricRecord = UsageMetricsRecord;
export type CreateUsageMetricRecordInput = CreateUsageMetricsRecordInput;
export type UpdateUsageMetricRecordInput = UpdateUsageMetricsRecordInput;

export const createUsageMetricRecord = async (
  input: CreateUsageMetricRecordInput
): Promise<UsageMetricRecord> => {
  return createUsageMetricsRecord(input as CreateUsageMetricsRecordInput) as Promise<UsageMetricRecord>;
};

export const updateUsageMetricRecord = async (
  id: string,
  input: UpdateUsageMetricRecordInput
): Promise<UsageMetricRecord> => {
  const merged = { ...(input as Record<string, any>), id } as UpdateUsageMetricsRecordInput;
  return updateUsageMetricsRecord(merged) as Promise<UsageMetricRecord>;
};
