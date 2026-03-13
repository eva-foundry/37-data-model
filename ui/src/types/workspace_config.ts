/**
 * WorkspaceConfig Types - Generated from Data Model Layer: workspace_config
 */

export interface WorkspaceConfigRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateWorkspaceConfigInput {
  id: string;
  [key: string]: any;
}

export interface UpdateWorkspaceConfigInput extends Partial<CreateWorkspaceConfigInput> {
  id: string;
}
