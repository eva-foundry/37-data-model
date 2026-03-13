/**
 * Traces Types - Generated from Data Model Layer: traces
 */

export interface TracesRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateTracesInput {
  id: string;
  [key: string]: any;
}

export interface UpdateTracesInput extends Partial<CreateTracesInput> {
  id: string;
}
