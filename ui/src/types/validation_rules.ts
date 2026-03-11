/**
 * ValidationRules Types - Generated from Data Model Layer: validation_rules
 */

export interface ValidationRulesRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateValidationRulesInput {
  id: string;
  [key: string]: any;
}

export interface UpdateValidationRulesInput extends Partial<CreateValidationRulesInput> {
  id: string;
}
