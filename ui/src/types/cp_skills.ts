/**
 * CpSkills Types - Generated from Data Model Layer: cp_skills
 */

export interface CpSkillsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateCpSkillsInput {
  id: string;
  [key: string]: any;
}

export interface UpdateCpSkillsInput extends Partial<CreateCpSkillsInput> {
  id: string;
}
