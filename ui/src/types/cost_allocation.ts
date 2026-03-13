/**
 * CostAllocation Types - Generated from Data Model Layer: cost_allocation
 */

export interface CostAllocationRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateCostAllocationInput {
  id: string;
  [key: string]: any;
}

export interface UpdateCostAllocationInput extends Partial<CreateCostAllocationInput> {
  id: string;
}
