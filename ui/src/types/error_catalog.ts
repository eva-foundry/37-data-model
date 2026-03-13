/**
 * ErrorCatalog Types - Generated from Data Model Layer: error_catalog
 */

export interface ErrorCatalogRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateErrorCatalogInput {
  id: string;
  [key: string]: any;
}

export interface UpdateErrorCatalogInput extends Partial<CreateErrorCatalogInput> {
  id: string;
}
