/**
 * QualityGates Types - Generated from Data Model Layer: quality_gates
 */

export interface QualityGatesRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateQualityGatesInput {
  id: string;
  [key: string]: any;
}

export interface UpdateQualityGatesInput extends Partial<CreateQualityGatesInput> {
  id: string;
}
