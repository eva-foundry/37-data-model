/**
 * SecurityControls Types - Generated from Data Model Layer: security_controls
 */

export interface SecurityControlsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateSecurityControlsInput {
  id: string;
  [key: string]: any;
}

export interface UpdateSecurityControlsInput extends Partial<CreateSecurityControlsInput> {
  id: string;
}
