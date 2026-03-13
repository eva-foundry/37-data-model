/**
 * Stories Types - Generated from Data Model Layer: stories
 */

export interface StoriesRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateStoriesInput {
  id: string;
  [key: string]: any;
}

export interface UpdateStoriesInput extends Partial<CreateStoriesInput> {
  id: string;
}
