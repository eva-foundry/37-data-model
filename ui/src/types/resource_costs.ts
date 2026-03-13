/**
 * ResourceCosts Types - Generated from Data Model Layer: resource_costs
 */

export interface ResourceCostsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateResourceCostsInput {
  id: string;
  [key: string]: any;
}

export interface UpdateResourceCostsInput extends Partial<CreateResourceCostsInput> {
  id: string;
}
