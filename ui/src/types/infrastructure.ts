/**
 * Infrastructure Types - Generated from Data Model Layer: infrastructure
 */

export interface InfrastructureRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateInfrastructureInput {
  id: string;
  [key: string]: any;
}

export interface UpdateInfrastructureInput extends Partial<CreateInfrastructureInput> {
  id: string;
}
