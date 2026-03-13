/**
 * SyntheticTests Types - Generated from Data Model Layer: synthetic_tests
 */

export interface SyntheticTestsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateSyntheticTestsInput {
  id: string;
  [key: string]: any;
}

export interface UpdateSyntheticTestsInput extends Partial<CreateSyntheticTestsInput> {
  id: string;
}
