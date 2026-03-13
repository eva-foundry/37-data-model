/**
 * WorkFactoryGovernance Types - Generated from Data Model Layer: work_factory_governance
 */

export interface WorkFactoryGovernanceRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateWorkFactoryGovernanceInput {
  id: string;
  [key: string]: any;
}

export interface UpdateWorkFactoryGovernanceInput extends Partial<CreateWorkFactoryGovernanceInput> {
  id: string;
}
