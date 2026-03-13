/**
 * WorkServiceRequests Types - Generated from Data Model Layer: work_service_requests
 */

export interface WorkServiceRequestsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateWorkServiceRequestsInput {
  id: string;
  [key: string]: any;
}

export interface UpdateWorkServiceRequestsInput extends Partial<CreateWorkServiceRequestsInput> {
  id: string;
}
