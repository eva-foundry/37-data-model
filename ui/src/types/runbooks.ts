/**
 * Runbooks Types - Generated from Data Model Layer: runbooks
 */

export interface RunbooksRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateRunbooksInput {
  id: string;
  [key: string]: any;
}

export interface UpdateRunbooksInput extends Partial<CreateRunbooksInput> {
  id: string;
}
