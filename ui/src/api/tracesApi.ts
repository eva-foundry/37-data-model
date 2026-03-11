/**
 * Traces API - Generated Stub
 * Layer: traces
 */

export interface TracesRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateTracesRecordInput {
  id: string;
  [key: string]: any;
}

export const createTracesRecord = async (
  input: CreateTracesRecordInput
): Promise<TracesRecord> => {
  // Mock API call - replace with actual API implementation
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: 'traces',
    partition_key: input.id,
    created_at: new Date().toISOString(),
  };
};

export interface UpdateTracesRecordInput extends Partial<CreateTracesRecordInput> {
  id: string;
}

export const updateTracesRecord = async (
  input: UpdateTracesRecordInput
): Promise<TracesRecord> => {
  // Mock API call - replace with actual API implementation
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: 'traces',
    partition_key: input.id,
    updated_at: new Date().toISOString(),
  } as TracesRecord;
};

// COMPATIBILITY EXPORTS: singular symbols + (id, input) update signature
export type TraceRecord = TracesRecord;
export type CreateTraceRecordInput = CreateTracesRecordInput;
export type UpdateTraceRecordInput = UpdateTracesRecordInput;

export const createTraceRecord = async (
  input: CreateTraceRecordInput
): Promise<TraceRecord> => {
  return createTracesRecord(input as CreateTracesRecordInput) as Promise<TraceRecord>;
};

export const updateTraceRecord = async (
  id: string,
  input: UpdateTraceRecordInput
): Promise<TraceRecord> => {
  const merged = { ...(input as Record<string, any>), id } as UpdateTracesRecordInput;
  return updateTracesRecord(merged) as Promise<TraceRecord>;
};
