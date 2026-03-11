/**
 * InfrastructureEvents Types - Generated from Data Model Layer: infrastructure_events
 */

export interface InfrastructureEventsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateInfrastructureEventsInput {
  id: string;
  [key: string]: any;
}

export interface UpdateInfrastructureEventsInput extends Partial<CreateInfrastructureEventsInput> {
  id: string;
}
