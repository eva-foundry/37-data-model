/**
 * WorkDecisionRecords Types - Generated from Data Model Layer: work_decision_records
 */

export interface WorkDecisionRecordsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateWorkDecisionRecordsInput {
  id: string;
  [key: string]: any;
}

export interface UpdateWorkDecisionRecordsInput extends Partial<CreateWorkDecisionRecordsInput> {
  id: string;
}
