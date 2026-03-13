/**
 * CiCdPipelines Types - Generated from Data Model Layer: ci_cd_pipelines
 */

export interface CiCdPipelinesRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateCiCdPipelinesInput {
  id: string;
  [key: string]: any;
}

export interface UpdateCiCdPipelinesInput extends Partial<CreateCiCdPipelinesInput> {
  id: string;
}
