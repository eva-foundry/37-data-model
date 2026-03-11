/**
 * Components API - Generated Stub
 * Layer: components
 */

export interface ComponentsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateComponentsRecordInput {
  id: string;
  [key: string]: any;
}

export const createComponentsRecord = async (
  input: CreateComponentsRecordInput
): Promise<ComponentsRecord> => {
  // Mock API call - replace with actual API implementation
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: 'components',
    partition_key: input.id,
    created_at: new Date().toISOString(),
  };
};

export interface UpdateComponentsRecordInput extends Partial<CreateComponentsRecordInput> {
  id: string;
}

export const updateComponentsRecord = async (
  input: UpdateComponentsRecordInput
): Promise<ComponentsRecord> => {
  // Mock API call - replace with actual API implementation
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: 'components',
    partition_key: input.id,
    updated_at: new Date().toISOString(),
  } as ComponentsRecord;
};

// COMPATIBILITY EXPORTS: singular symbols + (id, input) update signature
export type ComponentRecord = ComponentsRecord;
export type CreateComponentRecordInput = CreateComponentsRecordInput;
export type UpdateComponentRecordInput = UpdateComponentsRecordInput;

export const createComponentRecord = async (
  input: CreateComponentRecordInput
): Promise<ComponentRecord> => {
  return createComponentsRecord(input as CreateComponentsRecordInput) as Promise<ComponentRecord>;
};

export const updateComponentRecord = async (
  id: string,
  input: UpdateComponentRecordInput
): Promise<ComponentRecord> => {
  const merged = { ...(input as Record<string, any>), id } as UpdateComponentsRecordInput;
  return updateComponentsRecord(merged) as Promise<ComponentRecord>;
};
