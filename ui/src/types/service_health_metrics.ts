/**
 * ServiceHealthMetrics Types - Generated from Data Model Layer: service_health_metrics
 */

export interface ServiceHealthMetricsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateServiceHealthMetricsInput {
  id: string;
  [key: string]: any;
}

export interface UpdateServiceHealthMetricsInput extends Partial<CreateServiceHealthMetricsInput> {
  id: string;
}
