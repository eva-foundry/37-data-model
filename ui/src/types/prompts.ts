/**
 * Prompts Types - Generated from Data Model Layer: prompts
 */

export interface PromptsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreatePromptsInput {
  id: string;
  [key: string]: any;
}

export interface UpdatePromptsInput extends Partial<CreatePromptsInput> {
  id: string;
}
