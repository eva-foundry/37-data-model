/**
 * ConfigDefs API - Generated Stub
 * Layer: config_defs
 */

export interface ConfigDefsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateConfigDefsRecordInput {
  id: string;
  [key: string]: any;
}

export const createConfigDefsRecord = async (
  input: CreateConfigDefsRecordInput
): Promise<ConfigDefsRecord> => {
  // Mock API call - replace with actual API implementation
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: 'config_defs',
    partition_key: input.id,
    created_at: new Date().toISOString(),
  };
};

export interface UpdateConfigDefsRecordInput extends Partial<CreateConfigDefsRecordInput> {
  id: string;
}

export const updateConfigDefsRecord = async (
  input: UpdateConfigDefsRecordInput
): Promise<ConfigDefsRecord> => {
  // Mock API call - replace with actual API implementation
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: 'config_defs',
    partition_key: input.id,
    updated_at: new Date().toISOString(),
  } as ConfigDefsRecord;
};

// COMPATIBILITY EXPORTS: singular symbols + (id, input) update signature
export type ConfigDefRecord = ConfigDefsRecord;
export type CreateConfigDefRecordInput = CreateConfigDefsRecordInput;
export type UpdateConfigDefRecordInput = UpdateConfigDefsRecordInput;

export const createConfigDefRecord = async (
  input: CreateConfigDefRecordInput
): Promise<ConfigDefRecord> => {
  return createConfigDefsRecord(input as CreateConfigDefsRecordInput) as Promise<ConfigDefRecord>;
};

export const updateConfigDefRecord = async (
  id: string,
  input: UpdateConfigDefRecordInput
): Promise<ConfigDefRecord> => {
  const merged = { ...(input as Record<string, any>), id } as UpdateConfigDefsRecordInput;
  return updateConfigDefsRecord(merged) as Promise<ConfigDefRecord>;
};
