/**
 * EnvVars Types - Generated from Data Model Layer: env_vars
 */

export interface EnvVarsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateEnvVarsInput {
  id: string;
  [key: string]: any;
}

export interface UpdateEnvVarsInput extends Partial<CreateEnvVarsInput> {
  id: string;
}
