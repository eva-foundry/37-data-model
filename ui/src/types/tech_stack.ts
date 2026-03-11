/**
 * TechStack Types - Generated from Data Model Layer: tech_stack
 */

export interface TechStackRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateTechStackInput {
  id: string;
  [key: string]: any;
}

export interface UpdateTechStackInput extends Partial<CreateTechStackInput> {
  id: string;
}
