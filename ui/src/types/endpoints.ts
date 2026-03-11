/**
 * Endpoints Types - Generated from Data Model Layer: endpoints
 */

export interface EndpointsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateEndpointsInput {
  id: string;
  [key: string]: any;
}

export interface UpdateEndpointsInput extends Partial<CreateEndpointsInput> {
  id: string;
}
