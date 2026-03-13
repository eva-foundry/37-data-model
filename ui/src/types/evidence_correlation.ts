/**
 * EvidenceCorrelation Types - Generated from Data Model Layer: evidence_correlation
 */

export interface EvidenceCorrelationRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateEvidenceCorrelationInput {
  id: string;
  [key: string]: any;
}

export interface UpdateEvidenceCorrelationInput extends Partial<CreateEvidenceCorrelationInput> {
  id: string;
}
