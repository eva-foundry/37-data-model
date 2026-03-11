/**
 * VerificationRecords Types - Generated from Data Model Layer: verification_records
 */

export interface VerificationRecordsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateVerificationRecordsInput {
  id: string;
  [key: string]: any;
}

export interface UpdateVerificationRecordsInput extends Partial<CreateVerificationRecordsInput> {
  id: string;
}
