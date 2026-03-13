/**
 * Evidence Types - Generated from Data Model Layer: evidence
 */

export interface EvidenceRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateEvidenceInput {
  id: string;
  [key: string]: any;
}

export interface UpdateEvidenceInput extends Partial<CreateEvidenceInput> {
  id: string;
}
