/**
 * WorkFactoryCapabilities API - Generated Stub
 * Layer: work_factory_capabilities
 */

export interface WorkFactoryCapabilitiesRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateWorkFactoryCapabilitiesRecordInput {
  id: string;
  [key: string]: any;
}

export const createWorkFactoryCapabilitiesRecord = async (
  input: CreateWorkFactoryCapabilitiesRecordInput
): Promise<WorkFactoryCapabilitiesRecord> => {
  // Mock API call - replace with actual API implementation
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: 'work_factory_capabilities',
    partition_key: input.id,
    created_at: new Date().toISOString(),
  };
};

export interface UpdateWorkFactoryCapabilitiesRecordInput extends Partial<CreateWorkFactoryCapabilitiesRecordInput> {
  id: string;
}

export const updateWorkFactoryCapabilitiesRecord = async (
  input: UpdateWorkFactoryCapabilitiesRecordInput
): Promise<WorkFactoryCapabilitiesRecord> => {
  // Mock API call - replace with actual API implementation
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: 'work_factory_capabilities',
    partition_key: input.id,
    updated_at: new Date().toISOString(),
  } as WorkFactoryCapabilitiesRecord;
};

// COMPATIBILITY EXPORTS: singular symbols + (id, input) update signature
export type WorkFactoryCapabilityRecord = WorkFactoryCapabilitiesRecord;
export type CreateWorkFactoryCapabilityRecordInput = CreateWorkFactoryCapabilitiesRecordInput;
export type UpdateWorkFactoryCapabilityRecordInput = UpdateWorkFactoryCapabilitiesRecordInput;

export const createWorkFactoryCapabilityRecord = async (
  input: CreateWorkFactoryCapabilityRecordInput
): Promise<WorkFactoryCapabilityRecord> => {
  return createWorkFactoryCapabilitiesRecord(input as CreateWorkFactoryCapabilitiesRecordInput) as Promise<WorkFactoryCapabilityRecord>;
};

export const updateWorkFactoryCapabilityRecord = async (
  id: string,
  input: UpdateWorkFactoryCapabilityRecordInput
): Promise<WorkFactoryCapabilityRecord> => {
  const merged = { ...(input as Record<string, any>), id } as UpdateWorkFactoryCapabilitiesRecordInput;
  return updateWorkFactoryCapabilitiesRecord(merged) as Promise<WorkFactoryCapabilityRecord>;
};
