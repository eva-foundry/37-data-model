/**
 * Agents Types - Generated from Data Model Layer: agents
 */

export interface AgentsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateAgentsInput {
  id: string;
  [key: string]: any;
}

export interface UpdateAgentsInput extends Partial<CreateAgentsInput> {
  id: string;
}
