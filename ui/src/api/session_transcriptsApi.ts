/**
 * SessionTranscripts API - Generated Stub
 * Layer: session_transcripts
 */

export interface SessionTranscriptsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateSessionTranscriptsRecordInput {
  id: string;
  [key: string]: any;
}

export const createSessionTranscriptsRecord = async (
  input: CreateSessionTranscriptsRecordInput
): Promise<SessionTranscriptsRecord> => {
  // Mock API call - replace with actual API implementation
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: 'session_transcripts',
    partition_key: input.id,
    created_at: new Date().toISOString(),
  };
};

export interface UpdateSessionTranscriptsRecordInput extends Partial<CreateSessionTranscriptsRecordInput> {
  id: string;
}

export const updateSessionTranscriptsRecord = async (
  input: UpdateSessionTranscriptsRecordInput
): Promise<SessionTranscriptsRecord> => {
  // Mock API call - replace with actual API implementation
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: 'session_transcripts',
    partition_key: input.id,
    updated_at: new Date().toISOString(),
  } as SessionTranscriptsRecord;
};

// COMPATIBILITY EXPORTS: singular symbols + (id, input) update signature
export type SessionTranscriptRecord = SessionTranscriptsRecord;
export type CreateSessionTranscriptRecordInput = CreateSessionTranscriptsRecordInput;
export type UpdateSessionTranscriptRecordInput = UpdateSessionTranscriptsRecordInput;

export const createSessionTranscriptRecord = async (
  input: CreateSessionTranscriptRecordInput
): Promise<SessionTranscriptRecord> => {
  return createSessionTranscriptsRecord(input as CreateSessionTranscriptsRecordInput) as Promise<SessionTranscriptRecord>;
};

export const updateSessionTranscriptRecord = async (
  id: string,
  input: UpdateSessionTranscriptRecordInput
): Promise<SessionTranscriptRecord> => {
  const merged = { ...(input as Record<string, any>), id } as UpdateSessionTranscriptsRecordInput;
  return updateSessionTranscriptsRecord(merged) as Promise<SessionTranscriptRecord>;
};
