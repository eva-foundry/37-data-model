/**
 * Planes Types - Generated from Data Model Layer: planes
 */

export interface PlanesRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreatePlanesInput {
  id: string;
  [key: string]: any;
}

export interface UpdatePlanesInput extends Partial<CreatePlanesInput> {
  id: string;
}
