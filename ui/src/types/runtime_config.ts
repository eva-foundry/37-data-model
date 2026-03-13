/**
 * RuntimeConfig Types - Generated from Data Model Layer: runtime_config
 */

export interface RuntimeConfigRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateRuntimeConfigInput {
  id: string;
  [key: string]: any;
}

export interface UpdateRuntimeConfigInput extends Partial<CreateRuntimeConfigInput> {
  id: string;
}
