/**
 * TestCases Types - Generated from Data Model Layer: test_cases
 */

export interface TestCasesRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateTestCasesInput {
  id: string;
  [key: string]: any;
}

export interface UpdateTestCasesInput extends Partial<CreateTestCasesInput> {
  id: string;
}
