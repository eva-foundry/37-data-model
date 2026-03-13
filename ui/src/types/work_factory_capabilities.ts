/**
 * WorkFactoryCapabilities Types - Generated from Data Model Layer: work_factory_capabilities
 */

export interface WorkFactoryCapabilitiesRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateWorkFactoryCapabilitiesInput {
  id: string;
  [key: string]: any;
}

export interface UpdateWorkFactoryCapabilitiesInput extends Partial<CreateWorkFactoryCapabilitiesInput> {
  id: string;
}
