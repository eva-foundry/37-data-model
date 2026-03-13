/**
 * AgentExecutionHistory Types - Generated from Data Model Layer: agent_execution_history
 */

export interface AgentExecutionHistoryRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateAgentExecutionHistoryInput {
  id: string;
  [key: string]: any;
}

export interface UpdateAgentExecutionHistoryInput extends Partial<CreateAgentExecutionHistoryInput> {
  id: string;
}
