/**
 * UsageMetrics Types - Generated from Data Model Layer: usage_metrics
 */

export interface UsageMetricsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateUsageMetricsInput {
  id: string;
  [key: string]: any;
}

export interface UpdateUsageMetricsInput extends Partial<CreateUsageMetricsInput> {
  id: string;
}
