/**
 * Personas API - Generated Stub
 * Layer: personas
 */

export interface PersonasRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreatePersonasRecordInput {
  id: string;
  [key: string]: any;
}

export const createPersonasRecord = async (
  input: CreatePersonasRecordInput
): Promise<PersonasRecord> => {
  // Mock API call - replace with actual API implementation
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: 'personas',
    partition_key: input.id,
    created_at: new Date().toISOString(),
  };
};

export interface UpdatePersonasRecordInput extends Partial<CreatePersonasRecordInput> {
  id: string;
}

export const updatePersonasRecord = async (
  input: UpdatePersonasRecordInput
): Promise<PersonasRecord> => {
  // Mock API call - replace with actual API implementation
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: 'personas',
    partition_key: input.id,
    updated_at: new Date().toISOString(),
  } as PersonasRecord;
};

// COMPATIBILITY EXPORTS: singular symbols + (id, input) update signature
export type PersonaRecord = PersonasRecord;
export type CreatePersonaRecordInput = CreatePersonasRecordInput;
export type UpdatePersonaRecordInput = UpdatePersonasRecordInput;

export const createPersonaRecord = async (
  input: CreatePersonaRecordInput
): Promise<PersonaRecord> => {
  return createPersonasRecord(input as CreatePersonasRecordInput) as Promise<PersonaRecord>;
};

export const updatePersonaRecord = async (
  id: string,
  input: UpdatePersonaRecordInput
): Promise<PersonaRecord> => {
  const merged = { ...(input as Record<string, any>), id } as UpdatePersonasRecordInput;
  return updatePersonasRecord(merged) as Promise<PersonaRecord>;
};
