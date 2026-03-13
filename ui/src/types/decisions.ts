/**
 * Decisions Types - Generated from Data Model Layer: decisions
 */

export interface DecisionsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateDecisionsInput {
  id: string;
  [key: string]: any;
}

export interface UpdateDecisionsInput extends Partial<CreateDecisionsInput> {
  id: string;
}
