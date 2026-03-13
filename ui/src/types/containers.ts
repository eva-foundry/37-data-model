/**
 * Containers Types - Generated from Data Model Layer: containers
 */

export interface ContainersRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateContainersInput {
  id: string;
  [key: string]: any;
}

export interface UpdateContainersInput extends Partial<CreateContainersInput> {
  id: string;
}
