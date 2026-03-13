/**
 * AgentPerformanceMetrics API - Generated Stub
 * Layer: agent_performance_metrics
 */

export interface AgentPerformanceMetricsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateAgentPerformanceMetricsRecordInput {
  id: string;
  [key: string]: any;
}

export const createAgentPerformanceMetricsRecord = async (
  input: CreateAgentPerformanceMetricsRecordInput
): Promise<AgentPerformanceMetricsRecord> => {
  // Mock API call - replace with actual API implementation
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: 'agent_performance_metrics',
    partition_key: input.id,
    created_at: new Date().toISOString(),
  };
};

export interface UpdateAgentPerformanceMetricsRecordInput extends Partial<CreateAgentPerformanceMetricsRecordInput> {
  id: string;
}

export const updateAgentPerformanceMetricsRecord = async (
  input: UpdateAgentPerformanceMetricsRecordInput
): Promise<AgentPerformanceMetricsRecord> => {
  // Mock API call - replace with actual API implementation
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: 'agent_performance_metrics',
    partition_key: input.id,
    updated_at: new Date().toISOString(),
  } as AgentPerformanceMetricsRecord;
};

// COMPATIBILITY EXPORTS: singular symbols + (id, input) update signature
export type AgentPerformanceMetricRecord = AgentPerformanceMetricsRecord;
export type CreateAgentPerformanceMetricRecordInput = CreateAgentPerformanceMetricsRecordInput;
export type UpdateAgentPerformanceMetricRecordInput = UpdateAgentPerformanceMetricsRecordInput;

export const createAgentPerformanceMetricRecord = async (
  input: CreateAgentPerformanceMetricRecordInput
): Promise<AgentPerformanceMetricRecord> => {
  return createAgentPerformanceMetricsRecord(input as CreateAgentPerformanceMetricsRecordInput) as Promise<AgentPerformanceMetricRecord>;
};

export const updateAgentPerformanceMetricRecord = async (
  id: string,
  input: UpdateAgentPerformanceMetricRecordInput
): Promise<AgentPerformanceMetricRecord> => {
  const merged = { ...(input as Record<string, any>), id } as UpdateAgentPerformanceMetricsRecordInput;
  return updateAgentPerformanceMetricsRecord(merged) as Promise<AgentPerformanceMetricRecord>;
};
