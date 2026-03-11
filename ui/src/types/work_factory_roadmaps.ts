/**
 * WorkFactoryRoadmaps Types - Generated from Data Model Layer: work_factory_roadmaps
 */

export interface WorkFactoryRoadmapsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateWorkFactoryRoadmapsInput {
  id: string;
  [key: string]: any;
}

export interface UpdateWorkFactoryRoadmapsInput extends Partial<CreateWorkFactoryRoadmapsInput> {
  id: string;
}
