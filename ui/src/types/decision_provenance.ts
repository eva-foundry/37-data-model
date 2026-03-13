/**
 * DecisionProvenance Types - Generated from Data Model Layer: decision_provenance
 */

export interface DecisionProvenanceRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateDecisionProvenanceInput {
  id: string;
  [key: string]: any;
}

export interface UpdateDecisionProvenanceInput extends Partial<CreateDecisionProvenanceInput> {
  id: string;
}
