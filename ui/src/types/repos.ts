/**
 * Repos Types - Generated from Data Model Layer: repos
 */

export interface ReposRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateReposInput {
  id: string;
  [key: string]: any;
}

export interface UpdateReposInput extends Partial<CreateReposInput> {
  id: string;
}
