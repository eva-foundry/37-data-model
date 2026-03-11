/**
 * Risks Types - Generated from Data Model Layer: risks
 */

export interface RisksRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateRisksInput {
  id: string;
  [key: string]: any;
}

export interface UpdateRisksInput extends Partial<CreateRisksInput> {
  id: string;
}
