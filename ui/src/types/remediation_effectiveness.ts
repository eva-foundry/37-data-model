/**
 * RemediationEffectiveness Types - Generated from Data Model Layer: remediation_effectiveness
 */

export interface RemediationEffectivenessRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateRemediationEffectivenessInput {
  id: string;
  [key: string]: any;
}

export interface UpdateRemediationEffectivenessInput extends Partial<CreateRemediationEffectivenessInput> {
  id: string;
}
