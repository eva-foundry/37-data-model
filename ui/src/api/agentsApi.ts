/**
 * Agents API - Generated Stub
 * Layer: agents
 */

export interface AgentsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateAgentsRecordInput {
  id: string;
  [key: string]: any;
}

export const createAgentsRecord = async (
  input: CreateAgentsRecordInput
): Promise<AgentsRecord> => {
  // Mock API call - replace with actual API implementation
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: 'agents',
    partition_key: input.id,
    created_at: new Date().toISOString(),
  };
};

export interface UpdateAgentsRecordInput extends Partial<CreateAgentsRecordInput> {
  id: string;
}

export const updateAgentsRecord = async (
  input: UpdateAgentsRecordInput
): Promise<AgentsRecord> => {
  // Mock API call - replace with actual API implementation
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: 'agents',
    partition_key: input.id,
    updated_at: new Date().toISOString(),
  } as AgentsRecord;
};

// COMPATIBILITY EXPORTS: singular symbols + (id, input) update signature
export type AgentRecord = AgentsRecord;
export type CreateAgentRecordInput = CreateAgentsRecordInput;
export type UpdateAgentRecordInput = UpdateAgentsRecordInput;

export const createAgentRecord = async (
  input: CreateAgentRecordInput
): Promise<AgentRecord> => {
  return createAgentsRecord(input as CreateAgentsRecordInput) as Promise<AgentRecord>;
};

export const updateAgentRecord = async (
  id: string,
  input: UpdateAgentRecordInput
): Promise<AgentRecord> => {
  const merged = { ...(input as Record<string, any>), id } as UpdateAgentsRecordInput;
  return updateAgentsRecord(merged) as Promise<AgentRecord>;
};
