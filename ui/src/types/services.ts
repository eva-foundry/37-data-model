/**
 * Services Types - Generated from Data Model Layer: services
 */

export interface ServicesRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateServicesInput {
  id: string;
  [key: string]: any;
}

export interface UpdateServicesInput extends Partial<CreateServicesInput> {
  id: string;
}
