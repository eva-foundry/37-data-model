/**
 * ApiContracts Types - Generated from Data Model Layer: api_contracts
 */

export interface ApiContractsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateApiContractsInput {
  id: string;
  [key: string]: any;
}

export interface UpdateApiContractsInput extends Partial<CreateApiContractsInput> {
  id: string;
}
