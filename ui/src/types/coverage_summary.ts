/**
 * CoverageSummary Types - Generated from Data Model Layer: coverage_summary
 */

export interface CoverageSummaryRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateCoverageSummaryInput {
  id: string;
  [key: string]: any;
}

export interface UpdateCoverageSummaryInput extends Partial<CreateCoverageSummaryInput> {
  id: string;
}
