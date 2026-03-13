/**
 * ModelTelemetry Types - Generated from Data Model Layer: model_telemetry
 */

export interface ModelTelemetryRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateModelTelemetryInput {
  id: string;
  [key: string]: any;
}

export interface UpdateModelTelemetryInput extends Partial<CreateModelTelemetryInput> {
  id: string;
}
