/**
 * GithubRules Types - Generated from Data Model Layer: github_rules
 */

export interface GithubRulesRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateGithubRulesInput {
  id: string;
  [key: string]: any;
}

export interface UpdateGithubRulesInput extends Partial<CreateGithubRulesInput> {
  id: string;
}
