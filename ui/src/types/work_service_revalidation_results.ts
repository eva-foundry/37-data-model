/**
 * WorkServiceRevalidationResults Types - Generated from Data Model Layer: work_service_revalidation_results
 */

export interface WorkServiceRevalidationResultsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateWorkServiceRevalidationResultsInput {
  id: string;
  [key: string]: any;
}

export interface UpdateWorkServiceRevalidationResultsInput extends Partial<CreateWorkServiceRevalidationResultsInput> {
  id: string;
}
