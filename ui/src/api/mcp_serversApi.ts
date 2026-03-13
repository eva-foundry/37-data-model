/**
 * McpServers API - Generated Stub
 * Layer: mcp_servers
 */

export interface McpServersRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateMcpServersRecordInput {
  id: string;
  [key: string]: any;
}

export const createMcpServersRecord = async (
  input: CreateMcpServersRecordInput
): Promise<McpServersRecord> => {
  // Mock API call - replace with actual API implementation
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: 'mcp_servers',
    partition_key: input.id,
    created_at: new Date().toISOString(),
  };
};

export interface UpdateMcpServersRecordInput extends Partial<CreateMcpServersRecordInput> {
  id: string;
}

export const updateMcpServersRecord = async (
  input: UpdateMcpServersRecordInput
): Promise<McpServersRecord> => {
  // Mock API call - replace with actual API implementation
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: 'mcp_servers',
    partition_key: input.id,
    updated_at: new Date().toISOString(),
  } as McpServersRecord;
};

// COMPATIBILITY EXPORTS: singular symbols + (id, input) update signature
export type McpServerRecord = McpServersRecord;
export type CreateMcpServerRecordInput = CreateMcpServersRecordInput;
export type UpdateMcpServerRecordInput = UpdateMcpServersRecordInput;

export const createMcpServerRecord = async (
  input: CreateMcpServerRecordInput
): Promise<McpServerRecord> => {
  return createMcpServersRecord(input as CreateMcpServersRecordInput) as Promise<McpServerRecord>;
};

export const updateMcpServerRecord = async (
  id: string,
  input: UpdateMcpServerRecordInput
): Promise<McpServerRecord> => {
  const merged = { ...(input as Record<string, any>), id } as UpdateMcpServersRecordInput;
  return updateMcpServersRecord(merged) as Promise<McpServerRecord>;
};
