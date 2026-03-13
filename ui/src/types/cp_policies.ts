/**
 * CpPolicies Types - Generated from Data Model Layer: cp_policies
 */

export interface CpPoliciesRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateCpPoliciesInput {
  id: string;
  [key: string]: any;
}

export interface UpdateCpPoliciesInput extends Partial<CreateCpPoliciesInput> {
  id: string;
}
