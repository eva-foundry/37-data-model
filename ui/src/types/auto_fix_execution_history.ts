/**
 * AutoFixExecutionHistory Types - Generated from Data Model Layer: auto_fix_execution_history
 */

export interface AutoFixExecutionHistoryRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateAutoFixExecutionHistoryInput {
  id: string;
  [key: string]: any;
}

export interface UpdateAutoFixExecutionHistoryInput extends Partial<CreateAutoFixExecutionHistoryInput> {
  id: string;
}
