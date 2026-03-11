/**
 * DeploymentPolicies Types - Generated from Data Model Layer: deployment_policies
 */

export interface DeploymentPoliciesRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateDeploymentPoliciesInput {
  id: string;
  [key: string]: any;
}

export interface UpdateDeploymentPoliciesInput extends Partial<CreateDeploymentPoliciesInput> {
  id: string;
}
