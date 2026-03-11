/**
 * Literals Types - Generated from Data Model Layer: literals
 */

export interface LiteralsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateLiteralsInput {
  id: string;
  [key: string]: any;
}

export interface UpdateLiteralsInput extends Partial<CreateLiteralsInput> {
  id: string;
}
