/**
 * ValidationRules API - Generated Stub
 * Layer: validation_rules
 */

export interface ValidationRulesRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateValidationRulesRecordInput {
  id: string;
  [key: string]: any;
}

export const createValidationRulesRecord = async (
  input: CreateValidationRulesRecordInput
): Promise<ValidationRulesRecord> => {
  // Mock API call - replace with actual API implementation
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: 'validation_rules',
    partition_key: input.id,
    created_at: new Date().toISOString(),
  };
};

export interface UpdateValidationRulesRecordInput extends Partial<CreateValidationRulesRecordInput> {
  id: string;
}

export const updateValidationRulesRecord = async (
  input: UpdateValidationRulesRecordInput
): Promise<ValidationRulesRecord> => {
  // Mock API call - replace with actual API implementation
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: 'validation_rules',
    partition_key: input.id,
    updated_at: new Date().toISOString(),
  } as ValidationRulesRecord;
};

// COMPATIBILITY EXPORTS: singular symbols + (id, input) update signature
export type ValidationRuleRecord = ValidationRulesRecord;
export type CreateValidationRuleRecordInput = CreateValidationRulesRecordInput;
export type UpdateValidationRuleRecordInput = UpdateValidationRulesRecordInput;

export const createValidationRuleRecord = async (
  input: CreateValidationRuleRecordInput
): Promise<ValidationRuleRecord> => {
  return createValidationRulesRecord(input as CreateValidationRulesRecordInput) as Promise<ValidationRuleRecord>;
};

export const updateValidationRuleRecord = async (
  id: string,
  input: UpdateValidationRuleRecordInput
): Promise<ValidationRuleRecord> => {
  const merged = { ...(input as Record<string, any>), id } as UpdateValidationRulesRecordInput;
  return updateValidationRulesRecord(merged) as Promise<ValidationRuleRecord>;
};
