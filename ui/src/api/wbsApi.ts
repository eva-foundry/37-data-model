/**
 * WBS API - Demo Mock
 */

export interface WBSRecord {
  id: string;
  title: string;
  project_id: string;
  layer: string;
  [key: string]: any;
}

export interface CreateWBSRecordInput {
  id: string;
  title: string;
  project_id: string;
  [key: string]: any;
}

export const createWBSRecord = async (
  input: CreateWBSRecordInput
): Promise<WBSRecord> => {
  // Mock API call
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: 'L26',
    created_at: new Date().toISOString(),
  };
};

export interface UpdateWBSRecordInput extends Partial<CreateWBSRecordInput> {
  id: string;
}

export const updateWBSRecord = async (
  input: UpdateWBSRecordInput
): Promise<WBSRecord> => {
  // Mock API call
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: 'L26',
    updated_at: new Date().toISOString(),
  } as WBSRecord;
};

// COMPATIBILITY EXPORTS: singular symbols + (id, input) update signature
export type WbsItemRecord = WBSRecord;
export type CreateWbsItemRecordInput = CreateWBSRecordInput;
export type UpdateWbsItemRecordInput = UpdateWBSRecordInput;

export const createWbsItemRecord = async (
  input: CreateWbsItemRecordInput
): Promise<WbsItemRecord> => {
  return createWBSRecord(input as CreateWBSRecordInput) as Promise<WbsItemRecord>;
};

export const updateWbsItemRecord = async (
  id: string,
  input: UpdateWbsItemRecordInput
): Promise<WbsItemRecord> => {
  const merged = { ...(input as Record<string, any>), id } as UpdateWBSRecordInput;
  return updateWBSRecord(merged) as Promise<WbsItemRecord>;
};
