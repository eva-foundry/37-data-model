/**
 * AgentPerformanceMetrics Types - Generated from Data Model Layer: agent_performance_metrics
 */

export interface AgentPerformanceMetricsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateAgentPerformanceMetricsInput {
  id: string;
  [key: string]: any;
}

export interface UpdateAgentPerformanceMetricsInput extends Partial<CreateAgentPerformanceMetricsInput> {
  id: string;
}
