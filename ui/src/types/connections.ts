/**
 * Connections Types - Generated from Data Model Layer: connections
 */

export interface ConnectionsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateConnectionsInput {
  id: string;
  [key: string]: any;
}

export interface UpdateConnectionsInput extends Partial<CreateConnectionsInput> {
  id: string;
}
