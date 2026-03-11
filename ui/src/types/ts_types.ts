/**
 * TsTypes Types - Generated from Data Model Layer: ts_types
 */

export interface TsTypesRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateTsTypesInput {
  id: string;
  [key: string]: any;
}

export interface UpdateTsTypesInput extends Partial<CreateTsTypesInput> {
  id: string;
}
