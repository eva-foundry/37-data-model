/**
 * RemediationPolicies Types - Generated from Data Model Layer: remediation_policies
 */

export interface RemediationPoliciesRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateRemediationPoliciesInput {
  id: string;
  [key: string]: any;
}

export interface UpdateRemediationPoliciesInput extends Partial<CreateRemediationPoliciesInput> {
  id: string;
}
