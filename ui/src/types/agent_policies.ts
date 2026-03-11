/**
 * AgentPolicies Types - Generated from Data Model Layer: agent_policies
 */

export interface AgentPoliciesRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateAgentPoliciesInput {
  id: string;
  [key: string]: any;
}

export interface UpdateAgentPoliciesInput extends Partial<CreateAgentPoliciesInput> {
  id: string;
}
