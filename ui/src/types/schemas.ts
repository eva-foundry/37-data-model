/**
 * Schemas Types - Generated from Data Model Layer: schemas
 */

export interface SchemasRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateSchemasInput {
  id: string;
  [key: string]: any;
}

export interface UpdateSchemasInput extends Partial<CreateSchemasInput> {
  id: string;
}
