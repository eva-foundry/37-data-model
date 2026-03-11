/**
 * Containers API - Generated Stub
 * Layer: containers
 */

export interface ContainersRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateContainersRecordInput {
  id: string;
  [key: string]: any;
}

export const createContainersRecord = async (
  input: CreateContainersRecordInput
): Promise<ContainersRecord> => {
  // Mock API call - replace with actual API implementation
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: 'containers',
    partition_key: input.id,
    created_at: new Date().toISOString(),
  };
};

export interface UpdateContainersRecordInput extends Partial<CreateContainersRecordInput> {
  id: string;
}

export const updateContainersRecord = async (
  input: UpdateContainersRecordInput
): Promise<ContainersRecord> => {
  // Mock API call - replace with actual API implementation
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: 'containers',
    partition_key: input.id,
    updated_at: new Date().toISOString(),
  } as ContainersRecord;
};

// COMPATIBILITY EXPORTS: singular symbols + (id, input) update signature
export type ContainerRecord = ContainersRecord;
export type CreateContainerRecordInput = CreateContainersRecordInput;
export type UpdateContainerRecordInput = UpdateContainersRecordInput;

export const createContainerRecord = async (
  input: CreateContainerRecordInput
): Promise<ContainerRecord> => {
  return createContainersRecord(input as CreateContainersRecordInput) as Promise<ContainerRecord>;
};

export const updateContainerRecord = async (
  id: string,
  input: UpdateContainerRecordInput
): Promise<ContainerRecord> => {
  const merged = { ...(input as Record<string, any>), id } as UpdateContainersRecordInput;
  return updateContainersRecord(merged) as Promise<ContainerRecord>;
};
