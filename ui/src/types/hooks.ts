/**
 * Hooks Types - Generated from Data Model Layer: hooks
 */

export interface HooksRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateHooksInput {
  id: string;
  [key: string]: any;
}

export interface UpdateHooksInput extends Partial<CreateHooksInput> {
  id: string;
}
