/**
 * WorkServiceLevelObjectives Types - Generated from Data Model Layer: work_service_level_objectives
 */

export interface WorkServiceLevelObjectivesRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateWorkServiceLevelObjectivesInput {
  id: string;
  [key: string]: any;
}

export interface UpdateWorkServiceLevelObjectivesInput extends Partial<CreateWorkServiceLevelObjectivesInput> {
  id: string;
}
