/**
 * WorkServiceRemediationPlans Types - Generated from Data Model Layer: work_service_remediation_plans
 */

export interface WorkServiceRemediationPlansRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateWorkServiceRemediationPlansInput {
  id: string;
  [key: string]: any;
}

export interface UpdateWorkServiceRemediationPlansInput extends Partial<CreateWorkServiceRemediationPlansInput> {
  id: string;
}
