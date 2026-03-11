/**
 * DeploymentQualityScores Types - Generated from Data Model Layer: deployment_quality_scores
 */

export interface DeploymentQualityScoresRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateDeploymentQualityScoresInput {
  id: string;
  [key: string]: any;
}

export interface UpdateDeploymentQualityScoresInput extends Partial<CreateDeploymentQualityScoresInput> {
  id: string;
}
