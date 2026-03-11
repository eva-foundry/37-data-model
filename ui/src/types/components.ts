/**
 * Components Types - Generated from Data Model Layer: components
 */

export interface ComponentsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateComponentsInput {
  id: string;
  [key: string]: any;
}

export interface UpdateComponentsInput extends Partial<CreateComponentsInput> {
  id: string;
}
