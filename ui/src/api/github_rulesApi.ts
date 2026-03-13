/**
 * GithubRules API - Generated Stub
 * Layer: github_rules
 */

export interface GithubRulesRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateGithubRulesRecordInput {
  id: string;
  [key: string]: any;
}

export const createGithubRulesRecord = async (
  input: CreateGithubRulesRecordInput
): Promise<GithubRulesRecord> => {
  // Mock API call - replace with actual API implementation
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: 'github_rules',
    partition_key: input.id,
    created_at: new Date().toISOString(),
  };
};

export interface UpdateGithubRulesRecordInput extends Partial<CreateGithubRulesRecordInput> {
  id: string;
}

export const updateGithubRulesRecord = async (
  input: UpdateGithubRulesRecordInput
): Promise<GithubRulesRecord> => {
  // Mock API call - replace with actual API implementation
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: 'github_rules',
    partition_key: input.id,
    updated_at: new Date().toISOString(),
  } as GithubRulesRecord;
};

// COMPATIBILITY EXPORTS: singular symbols + (id, input) update signature
export type GithubRuleRecord = GithubRulesRecord;
export type CreateGithubRuleRecordInput = CreateGithubRulesRecordInput;
export type UpdateGithubRuleRecordInput = UpdateGithubRulesRecordInput;

export const createGithubRuleRecord = async (
  input: CreateGithubRuleRecordInput
): Promise<GithubRuleRecord> => {
  return createGithubRulesRecord(input as CreateGithubRulesRecordInput) as Promise<GithubRuleRecord>;
};

export const updateGithubRuleRecord = async (
  id: string,
  input: UpdateGithubRuleRecordInput
): Promise<GithubRuleRecord> => {
  const merged = { ...(input as Record<string, any>), id } as UpdateGithubRulesRecordInput;
  return updateGithubRulesRecord(merged) as Promise<GithubRuleRecord>;
};
