/**
 * CostTracking Types - Generated from Data Model Layer: cost_tracking
 */

export interface CostTrackingRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateCostTrackingInput {
  id: string;
  [key: string]: any;
}

export interface UpdateCostTrackingInput extends Partial<CreateCostTrackingInput> {
  id: string;
}
