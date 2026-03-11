/**
 * Sprints API - Demo Mock
 */

export interface SprintsRecord {
  id: string;
  goal?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  velocity?: number;
  project_id?: string;
  wbs_id?: string;
  layer: string;
  [key: string]: any;
}

export interface CreateSprintsRecordInput {
  id: string;
  goal?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  velocity?: number;
  project_id?: string;
  wbs_id?: string;
  [key: string]: any;
}

export const createSprintsRecord = async (
  input: CreateSprintsRecordInput
): Promise<SprintsRecord> => {
  // Mock API call
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: 'L27',
    created_at: new Date().toISOString(),
  };
};

export interface UpdateSprintsRecordInput extends Partial<CreateSprintsRecordInput> {
  id: string;
}

export const updateSprintsRecord = async (
  input: UpdateSprintsRecordInput
): Promise<SprintsRecord> => {
  // Mock API call
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: 'L27',
    updated_at: new Date().toISOString(),
  } as SprintsRecord;
};

// COMPATIBILITY EXPORTS: singular symbols + (id, input) update signature
export type SprintRecord = SprintsRecord;
export type CreateSprintRecordInput = CreateSprintsRecordInput;
export type UpdateSprintRecordInput = UpdateSprintsRecordInput;

export const createSprintRecord = async (
  input: CreateSprintRecordInput
): Promise<SprintRecord> => {
  return createSprintsRecord(input as CreateSprintsRecordInput) as Promise<SprintRecord>;
};

export const updateSprintRecord = async (
  id: string,
  input: UpdateSprintRecordInput
): Promise<SprintRecord> => {
  const merged = { ...(input as Record<string, any>), id } as UpdateSprintsRecordInput;
  return updateSprintsRecord(merged) as Promise<SprintRecord>;
};
