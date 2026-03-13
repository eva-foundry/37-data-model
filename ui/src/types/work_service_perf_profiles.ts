/**
 * WorkServicePerfProfiles Types - Generated from Data Model Layer: work_service_perf_profiles
 */

export interface WorkServicePerfProfilesRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateWorkServicePerfProfilesInput {
  id: string;
  [key: string]: any;
}

export interface UpdateWorkServicePerfProfilesInput extends Partial<CreateWorkServicePerfProfilesInput> {
  id: string;
}
