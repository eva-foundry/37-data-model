/**
 * WorkFactoryServices Types - Generated from Data Model Layer: work_factory_services
 */

export interface WorkFactoryServicesRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateWorkFactoryServicesInput {
  id: string;
  [key: string]: any;
}

export interface UpdateWorkFactoryServicesInput extends Partial<CreateWorkFactoryServicesInput> {
  id: string;
}
