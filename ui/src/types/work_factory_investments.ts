/**
 * WorkFactoryInvestments Types - Generated from Data Model Layer: work_factory_investments
 */

export interface WorkFactoryInvestmentsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateWorkFactoryInvestmentsInput {
  id: string;
  [key: string]: any;
}

export interface UpdateWorkFactoryInvestmentsInput extends Partial<CreateWorkFactoryInvestmentsInput> {
  id: string;
}
