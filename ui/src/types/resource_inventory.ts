/**
 * ResourceInventory Types - Generated from Data Model Layer: resource_inventory
 */

export interface ResourceInventoryRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateResourceInventoryInput {
  id: string;
  [key: string]: any;
}

export interface UpdateResourceInventoryInput extends Partial<CreateResourceInventoryInput> {
  id: string;
}
