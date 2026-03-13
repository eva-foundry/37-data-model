/**
 * WorkExecutionUnits Types - Generated from Data Model Layer: work_execution_units
 */

export interface WorkExecutionUnitsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateWorkExecutionUnitsInput {
  id: string;
  [key: string]: any;
}

export interface UpdateWorkExecutionUnitsInput extends Partial<CreateWorkExecutionUnitsInput> {
  id: string;
}
