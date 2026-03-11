/**
 * Requirements Types - Generated from Data Model Layer: requirements
 */

export interface RequirementsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateRequirementsInput {
  id: string;
  [key: string]: any;
}

export interface UpdateRequirementsInput extends Partial<CreateRequirementsInput> {
  id: string;
}
