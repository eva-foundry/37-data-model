/**
 * RemediationOutcomes Types - Generated from Data Model Layer: remediation_outcomes
 */

export interface RemediationOutcomesRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateRemediationOutcomesInput {
  id: string;
  [key: string]: any;
}

export interface UpdateRemediationOutcomesInput extends Partial<CreateRemediationOutcomesInput> {
  id: string;
}
