/**
 * Instructions Types - Generated from Data Model Layer: instructions
 */

export interface InstructionsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateInstructionsInput {
  id: string;
  [key: string]: any;
}

export interface UpdateInstructionsInput extends Partial<CreateInstructionsInput> {
  id: string;
}
