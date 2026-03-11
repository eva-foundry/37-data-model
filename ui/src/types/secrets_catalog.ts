/**
 * SecretsCatalog Types - Generated from Data Model Layer: secrets_catalog
 */

export interface SecretsCatalogRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateSecretsCatalogInput {
  id: string;
  [key: string]: any;
}

export interface UpdateSecretsCatalogInput extends Partial<CreateSecretsCatalogInput> {
  id: string;
}
