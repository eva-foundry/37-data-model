/**
 * EvaModel Types - Generated from Data Model Layer: eva_model
 */

export interface EvaModelRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateEvaModelInput {
  id: string;
  [key: string]: any;
}

export interface UpdateEvaModelInput extends Partial<CreateEvaModelInput> {
  id: string;
}
