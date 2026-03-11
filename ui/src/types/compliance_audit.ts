/**
 * ComplianceAudit Types - Generated from Data Model Layer: compliance_audit
 */

export interface ComplianceAuditRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateComplianceAuditInput {
  id: string;
  [key: string]: any;
}

export interface UpdateComplianceAuditInput extends Partial<CreateComplianceAuditInput> {
  id: string;
}
