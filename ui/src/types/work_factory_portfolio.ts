/**
 * WorkFactoryPortfolio Types - Generated from Data Model Layer: work_factory_portfolio
 */

export interface WorkFactoryPortfolioRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateWorkFactoryPortfolioInput {
  id: string;
  [key: string]: any;
}

export interface UpdateWorkFactoryPortfolioInput extends Partial<CreateWorkFactoryPortfolioInput> {
  id: string;
}
