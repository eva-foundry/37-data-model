/**
 * TsTypes API - Generated Stub
 * Layer: ts_types
 */

export interface TsTypesRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateTsTypesRecordInput {
  id: string;
  [key: string]: any;
}

export const createTsTypesRecord = async (
  input: CreateTsTypesRecordInput
): Promise<TsTypesRecord> => {
  // Mock API call - replace with actual API implementation
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: 'ts_types',
    partition_key: input.id,
    created_at: new Date().toISOString(),
  };
};

export interface UpdateTsTypesRecordInput extends Partial<CreateTsTypesRecordInput> {
  id: string;
}

export const updateTsTypesRecord = async (
  input: UpdateTsTypesRecordInput
): Promise<TsTypesRecord> => {
  // Mock API call - replace with actual API implementation
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: 'ts_types',
    partition_key: input.id,
    updated_at: new Date().toISOString(),
  } as TsTypesRecord;
};

// COMPATIBILITY EXPORTS: singular symbols + (id, input) update signature
export type TsTypeRecord = TsTypesRecord;
export type CreateTsTypeRecordInput = CreateTsTypesRecordInput;
export type UpdateTsTypeRecordInput = UpdateTsTypesRecordInput;

export const createTsTypeRecord = async (
  input: CreateTsTypeRecordInput
): Promise<TsTypeRecord> => {
  return createTsTypesRecord(input as CreateTsTypesRecordInput) as Promise<TsTypeRecord>;
};

export const updateTsTypeRecord = async (
  id: string,
  input: UpdateTsTypeRecordInput
): Promise<TsTypeRecord> => {
  const merged = { ...(input as Record<string, any>), id } as UpdateTsTypesRecordInput;
  return updateTsTypesRecord(merged) as Promise<TsTypeRecord>;
};
