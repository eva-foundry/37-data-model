/**
 * FeatureFlags Types - Generated from Data Model Layer: feature_flags
 */

export interface FeatureFlagsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateFeatureFlagsInput {
  id: string;
  [key: string]: any;
}

export interface UpdateFeatureFlagsInput extends Partial<CreateFeatureFlagsInput> {
  id: string;
}
