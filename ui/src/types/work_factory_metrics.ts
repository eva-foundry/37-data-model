/**
 * WorkFactoryMetrics Types - Generated from Data Model Layer: work_factory_metrics
 */

export interface WorkFactoryMetricsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateWorkFactoryMetricsInput {
  id: string;
  [key: string]: any;
}

export interface UpdateWorkFactoryMetricsInput extends Partial<CreateWorkFactoryMetricsInput> {
  id: string;
}
