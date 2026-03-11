/**
 * WorkPatternPerformanceProfiles Types - Generated from Data Model Layer: work_pattern_performance_profiles
 */

export interface WorkPatternPerformanceProfilesRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateWorkPatternPerformanceProfilesInput {
  id: string;
  [key: string]: any;
}

export interface UpdateWorkPatternPerformanceProfilesInput extends Partial<CreateWorkPatternPerformanceProfilesInput> {
  id: string;
}
