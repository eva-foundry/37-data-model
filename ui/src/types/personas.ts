/**
 * Personas Types - Generated from Data Model Layer: personas
 */

export interface PersonasRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreatePersonasInput {
  id: string;
  [key: string]: any;
}

export interface UpdatePersonasInput extends Partial<CreatePersonasInput> {
  id: string;
}
