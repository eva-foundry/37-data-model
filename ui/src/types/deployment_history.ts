/**
 * DeploymentHistory Types - Generated from Data Model Layer: deployment_history
 */

export interface DeploymentHistoryRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateDeploymentHistoryInput {
  id: string;
  [key: string]: any;
}

export interface UpdateDeploymentHistoryInput extends Partial<CreateDeploymentHistoryInput> {
  id: string;
}
