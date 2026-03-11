/**
 * AzureInfrastructure Types - Generated from Data Model Layer: azure_infrastructure
 */

export interface AzureInfrastructureRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateAzureInfrastructureInput {
  id: string;
  [key: string]: any;
}

export interface UpdateAzureInfrastructureInput extends Partial<CreateAzureInfrastructureInput> {
  id: string;
}
