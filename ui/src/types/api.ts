// Common API response types for EVA Data Model
// All layer endpoints return this standard structure

export interface ApiResponse<T> {
  data: T[];
  _pagination: Pagination;
}

export interface Pagination {
  total_results: number;
  returned: number;
  offset: number;
  limit: number;
}

/** Base model object - all layers share these audit fields */
export interface ModelObject {
  obj_id?: string;
  layer: string;
  id: string;
  is_active?: boolean;
  row_version?: number;
  created_at?: string;
  created_by?: string;
  modified_at?: string;
  modified_by?: string;
  source_file?: string;
  // Layer-specific fields extend this base
  [key: string]: unknown;
}

/** Health check response */
export interface ApiHealth {
  status: string;
  service: string;
  version: string;
  store: string;
  cache: string;
  uptime_seconds?: number;
}

/** Layer metadata response */
export interface LayerMetadata {
  layer_name: string;
  operational: boolean;
  object_count: number;
  priority: string;
  category: string;
}
