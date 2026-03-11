/**
 * Projects API - Demo Mock
 */

export interface ProjectsRecord {
  id: string;
  goal: string;
  maturity: string;
  label_fr: string;
  label_en: string;
  layer: string;
  [key: string]: any;
}

export interface CreateProjectsRecordInput {
  id: string;
  goal: string;
  maturity: string;
  label_fr: string;
  label_en: string;
  [key: string]: any;
}

export const createProjectsRecord = async (
  input: CreateProjectsRecordInput
): Promise<ProjectsRecord> => {
  // Mock API call
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: 'L25',
    created_at: new Date().toISOString(),
  };
};

export interface UpdateProjectsRecordInput extends Partial<CreateProjectsRecordInput> {
  id: string;
}

export const updateProjectsRecord = async (
  input: UpdateProjectsRecordInput
): Promise<ProjectsRecord> => {
  // Mock API call
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: 'L25',
    updated_at: new Date().toISOString(),
  } as ProjectsRecord;
};

// COMPATIBILITY EXPORTS: singular symbols + (id, input) update signature
export type ProjectRecord = ProjectsRecord;
export type CreateProjectRecordInput = CreateProjectsRecordInput;
export type UpdateProjectRecordInput = UpdateProjectsRecordInput;

export const createProjectRecord = async (
  input: CreateProjectRecordInput
): Promise<ProjectRecord> => {
  return createProjectsRecord(input as CreateProjectsRecordInput) as Promise<ProjectRecord>;
};

export const updateProjectRecord = async (
  id: string,
  input: UpdateProjectRecordInput
): Promise<ProjectRecord> => {
  const merged = { ...(input as Record<string, any>), id } as UpdateProjectsRecordInput;
  return updateProjectsRecord(merged) as Promise<ProjectRecord>;
};
