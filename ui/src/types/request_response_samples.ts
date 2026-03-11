/**
 * RequestResponseSamples Types - Generated from Data Model Layer: request_response_samples
 */

export interface RequestResponseSamplesRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateRequestResponseSamplesInput {
  id: string;
  [key: string]: any;
}

export interface UpdateRequestResponseSamplesInput extends Partial<CreateRequestResponseSamplesInput> {
  id: string;
}
