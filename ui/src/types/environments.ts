/**
 * Environments Types - Generated from Data Model Layer: environments
 */

export interface EnvironmentsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateEnvironmentsInput {
  id: string;
  [key: string]: any;
}

export interface UpdateEnvironmentsInput extends Partial<CreateEnvironmentsInput> {
  id: string;
}
