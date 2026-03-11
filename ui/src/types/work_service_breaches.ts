/**
 * WorkServiceBreaches Types - Generated from Data Model Layer: work_service_breaches
 */

export interface WorkServiceBreachesRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateWorkServiceBreachesInput {
  id: string;
  [key: string]: any;
}

export interface UpdateWorkServiceBreachesInput extends Partial<CreateWorkServiceBreachesInput> {
  id: string;
}
