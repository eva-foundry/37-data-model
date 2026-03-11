/**
 * DeploymentRecords Types - Generated from Data Model Layer: deployment_records
 */

export interface DeploymentRecordsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateDeploymentRecordsInput {
  id: string;
  [key: string]: any;
}

export interface UpdateDeploymentRecordsInput extends Partial<CreateDeploymentRecordsInput> {
  id: string;
}
