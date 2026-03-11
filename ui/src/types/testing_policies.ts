/**
 * TestingPolicies Types - Generated from Data Model Layer: testing_policies
 */

export interface TestingPoliciesRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateTestingPoliciesInput {
  id: string;
  [key: string]: any;
}

export interface UpdateTestingPoliciesInput extends Partial<CreateTestingPoliciesInput> {
  id: string;
}
