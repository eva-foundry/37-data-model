/**
 * Milestones Types - Generated from Data Model Layer: milestones
 */

export interface MilestonesRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateMilestonesInput {
  id: string;
  [key: string]: any;
}

export interface UpdateMilestonesInput extends Partial<CreateMilestonesInput> {
  id: string;
}
