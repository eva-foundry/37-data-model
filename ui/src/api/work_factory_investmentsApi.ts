/**
 * WorkFactoryInvestments API - Generated Stub
 * Layer: work_factory_investments
 */

export interface WorkFactoryInvestmentsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateWorkFactoryInvestmentsRecordInput {
  id: string;
  [key: string]: any;
}

export const createWorkFactoryInvestmentsRecord = async (
  input: CreateWorkFactoryInvestmentsRecordInput
): Promise<WorkFactoryInvestmentsRecord> => {
  // Mock API call - replace with actual API implementation
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: 'work_factory_investments',
    partition_key: input.id,
    created_at: new Date().toISOString(),
  };
};

export interface UpdateWorkFactoryInvestmentsRecordInput extends Partial<CreateWorkFactoryInvestmentsRecordInput> {
  id: string;
}

export const updateWorkFactoryInvestmentsRecord = async (
  input: UpdateWorkFactoryInvestmentsRecordInput
): Promise<WorkFactoryInvestmentsRecord> => {
  // Mock API call - replace with actual API implementation
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: 'work_factory_investments',
    partition_key: input.id,
    updated_at: new Date().toISOString(),
  } as WorkFactoryInvestmentsRecord;
};

// COMPATIBILITY EXPORTS: singular symbols + (id, input) update signature
export type WorkFactoryInvestmentRecord = WorkFactoryInvestmentsRecord;
export type CreateWorkFactoryInvestmentRecordInput = CreateWorkFactoryInvestmentsRecordInput;
export type UpdateWorkFactoryInvestmentRecordInput = UpdateWorkFactoryInvestmentsRecordInput;

export const createWorkFactoryInvestmentRecord = async (
  input: CreateWorkFactoryInvestmentRecordInput
): Promise<WorkFactoryInvestmentRecord> => {
  return createWorkFactoryInvestmentsRecord(input as CreateWorkFactoryInvestmentsRecordInput) as Promise<WorkFactoryInvestmentRecord>;
};

export const updateWorkFactoryInvestmentRecord = async (
  id: string,
  input: UpdateWorkFactoryInvestmentRecordInput
): Promise<WorkFactoryInvestmentRecord> => {
  const merged = { ...(input as Record<string, any>), id } as UpdateWorkFactoryInvestmentsRecordInput;
  return updateWorkFactoryInvestmentsRecord(merged) as Promise<WorkFactoryInvestmentRecord>;
};
