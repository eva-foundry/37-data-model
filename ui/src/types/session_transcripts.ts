/**
 * SessionTranscripts Types - Generated from Data Model Layer: session_transcripts
 */

export interface SessionTranscriptsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateSessionTranscriptsInput {
  id: string;
  [key: string]: any;
}

export interface UpdateSessionTranscriptsInput extends Partial<CreateSessionTranscriptsInput> {
  id: string;
}
