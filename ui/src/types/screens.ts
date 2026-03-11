/**
 * Screens Types - Generated from Data Model Layer: screens
 */

export interface ScreensRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateScreensInput {
  id: string;
  [key: string]: any;
}

export interface UpdateScreensInput extends Partial<CreateScreensInput> {
  id: string;
}
