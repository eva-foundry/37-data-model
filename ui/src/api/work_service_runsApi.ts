/**
 * WorkServiceRuns API - Generated Stub
 * Layer: work_service_runs
 */

export interface WorkServiceRunsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateWorkServiceRunsRecordInput {
  id: string;
  [key: string]: any;
}

export const createWorkServiceRunsRecord = async (
  input: CreateWorkServiceRunsRecordInput
): Promise<WorkServiceRunsRecord> => {
  // Mock API call - replace with actual API implementation
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: 'work_service_runs',
    partition_key: input.id,
    created_at: new Date().toISOString(),
  };
};

export interface UpdateWorkServiceRunsRecordInput extends Partial<CreateWorkServiceRunsRecordInput> {
  id: string;
}

export const updateWorkServiceRunsRecord = async (
  input: UpdateWorkServiceRunsRecordInput
): Promise<WorkServiceRunsRecord> => {
  // Mock API call - replace with actual API implementation
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: 'work_service_runs',
    partition_key: input.id,
    updated_at: new Date().toISOString(),
  } as WorkServiceRunsRecord;
};

// COMPATIBILITY EXPORTS: singular symbols + (id, input) update signature
export type WorkServiceRunRecord = WorkServiceRunsRecord;
export type CreateWorkServiceRunRecordInput = CreateWorkServiceRunsRecordInput;
export type UpdateWorkServiceRunRecordInput = UpdateWorkServiceRunsRecordInput;

export const createWorkServiceRunRecord = async (
  input: CreateWorkServiceRunRecordInput
): Promise<WorkServiceRunRecord> => {
  return createWorkServiceRunsRecord(input as CreateWorkServiceRunsRecordInput) as Promise<WorkServiceRunRecord>;
};

export const updateWorkServiceRunRecord = async (
  id: string,
  input: UpdateWorkServiceRunRecordInput
): Promise<WorkServiceRunRecord> => {
  const merged = { ...(input as Record<string, any>), id } as UpdateWorkServiceRunsRecordInput;
  return updateWorkServiceRunsRecord(merged) as Promise<WorkServiceRunRecord>;
};
