/**
 * CpAgents Types - Generated from Data Model Layer: cp_agents
 */

export interface CpAgentsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateCpAgentsInput {
  id: string;
  [key: string]: any;
}

export interface UpdateCpAgentsInput extends Partial<CreateCpAgentsInput> {
  id: string;
}
