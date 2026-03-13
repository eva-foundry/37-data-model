/**
 * InfrastructureDrift Types - Generated from Data Model Layer: infrastructure_drift
 */

export interface InfrastructureDriftRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateInfrastructureDriftInput {
  id: string;
  [key: string]: any;
}

export interface UpdateInfrastructureDriftInput extends Partial<CreateInfrastructureDriftInput> {
  id: string;
}
