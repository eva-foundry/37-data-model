/**
 * DeploymentTargets Types - Generated from Data Model Layer: deployment_targets
 */

export interface DeploymentTargetsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateDeploymentTargetsInput {
  id: string;
  [key: string]: any;
}

export interface UpdateDeploymentTargetsInput extends Partial<CreateDeploymentTargetsInput> {
  id: string;
}
