/**
 * PerformanceTrends Types - Generated from Data Model Layer: performance_trends
 */

export interface PerformanceTrendsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreatePerformanceTrendsInput {
  id: string;
  [key: string]: any;
}

export interface UpdatePerformanceTrendsInput extends Partial<CreatePerformanceTrendsInput> {
  id: string;
}
