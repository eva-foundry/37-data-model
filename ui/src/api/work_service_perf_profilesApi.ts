/**
 * WorkServicePerfProfiles API - Generated Stub
 * Layer: work_service_perf_profiles
 */

export interface WorkServicePerfProfilesRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateWorkServicePerfProfilesRecordInput {
  id: string;
  [key: string]: any;
}

export const createWorkServicePerfProfilesRecord = async (
  input: CreateWorkServicePerfProfilesRecordInput
): Promise<WorkServicePerfProfilesRecord> => {
  // Mock API call - replace with actual API implementation
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: 'work_service_perf_profiles',
    partition_key: input.id,
    created_at: new Date().toISOString(),
  };
};

export interface UpdateWorkServicePerfProfilesRecordInput extends Partial<CreateWorkServicePerfProfilesRecordInput> {
  id: string;
}

export const updateWorkServicePerfProfilesRecord = async (
  input: UpdateWorkServicePerfProfilesRecordInput
): Promise<WorkServicePerfProfilesRecord> => {
  // Mock API call - replace with actual API implementation
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: 'work_service_perf_profiles',
    partition_key: input.id,
    updated_at: new Date().toISOString(),
  } as WorkServicePerfProfilesRecord;
};

// COMPATIBILITY EXPORTS: singular symbols + (id, input) update signature
export type WorkServicePerfProfileRecord = WorkServicePerfProfilesRecord;
export type CreateWorkServicePerfProfileRecordInput = CreateWorkServicePerfProfilesRecordInput;
export type UpdateWorkServicePerfProfileRecordInput = UpdateWorkServicePerfProfilesRecordInput;

export const createWorkServicePerfProfileRecord = async (
  input: CreateWorkServicePerfProfileRecordInput
): Promise<WorkServicePerfProfileRecord> => {
  return createWorkServicePerfProfilesRecord(input as CreateWorkServicePerfProfilesRecordInput) as Promise<WorkServicePerfProfileRecord>;
};

export const updateWorkServicePerfProfileRecord = async (
  id: string,
  input: UpdateWorkServicePerfProfileRecordInput
): Promise<WorkServicePerfProfileRecord> => {
  const merged = { ...(input as Record<string, any>), id } as UpdateWorkServicePerfProfilesRecordInput;
  return updateWorkServicePerfProfilesRecord(merged) as Promise<WorkServicePerfProfileRecord>;
};
