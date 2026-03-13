/**
 * Instructions API - Generated Stub
 * Layer: instructions
 */

export interface InstructionsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateInstructionsRecordInput {
  id: string;
  [key: string]: any;
}

export const createInstructionsRecord = async (
  input: CreateInstructionsRecordInput
): Promise<InstructionsRecord> => {
  // Mock API call - replace with actual API implementation
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: 'instructions',
    partition_key: input.id,
    created_at: new Date().toISOString(),
  };
};

export interface UpdateInstructionsRecordInput extends Partial<CreateInstructionsRecordInput> {
  id: string;
}

export const updateInstructionsRecord = async (
  input: UpdateInstructionsRecordInput
): Promise<InstructionsRecord> => {
  // Mock API call - replace with actual API implementation
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: 'instructions',
    partition_key: input.id,
    updated_at: new Date().toISOString(),
  } as InstructionsRecord;
};

// COMPATIBILITY EXPORTS: singular symbols + (id, input) update signature
export type InstructionRecord = InstructionsRecord;
export type CreateInstructionRecordInput = CreateInstructionsRecordInput;
export type UpdateInstructionRecordInput = UpdateInstructionsRecordInput;

export const createInstructionRecord = async (
  input: CreateInstructionRecordInput
): Promise<InstructionRecord> => {
  return createInstructionsRecord(input as CreateInstructionsRecordInput) as Promise<InstructionRecord>;
};

export const updateInstructionRecord = async (
  id: string,
  input: UpdateInstructionRecordInput
): Promise<InstructionRecord> => {
  const merged = { ...(input as Record<string, any>), id } as UpdateInstructionsRecordInput;
  return updateInstructionsRecord(merged) as Promise<InstructionRecord>;
};
