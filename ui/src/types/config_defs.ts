/**
 * ConfigDefs Types - Generated from Data Model Layer: config_defs
 */

export interface ConfigDefsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateConfigDefsInput {
  id: string;
  [key: string]: any;
}

export interface UpdateConfigDefsInput extends Partial<CreateConfigDefsInput> {
  id: string;
}
