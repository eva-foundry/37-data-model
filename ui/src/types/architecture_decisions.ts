/**
 * ArchitectureDecisions Types - Generated from Data Model Layer: architecture_decisions
 */

export interface ArchitectureDecisionsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateArchitectureDecisionsInput {
  id: string;
  [key: string]: any;
}

export interface UpdateArchitectureDecisionsInput extends Partial<CreateArchitectureDecisionsInput> {
  id: string;
}
