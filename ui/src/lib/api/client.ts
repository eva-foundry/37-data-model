// EVA Data Model API Client
// Base client for all layer queries with fire-hose protection

import type { ApiResponse, ApiHealth, LayerMetadata } from '@/types/api';

const DATA_MODEL_BASE: string =
  (import.meta.env?.['VITE_DATA_MODEL_URL'] as string | undefined) ??
  (typeof process !== 'undefined' ? process.env?.['DATA_MODEL_URL'] : undefined) ??
  'https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io';

// Known operational layers (from Session 44)
export const OPERATIONAL_LAYERS = [
  'projects', 'sprints', 'stories', 'tasks', 'evidence',
  'coverage_summary', 'services', 'repos', 'tech_stack',
  'architecture_decisions', 'endpoints', 'api_contracts',
  'request_response_samples', 'deployment_targets', 'containers',
  'screens', 'literals', 'cache_layer', 'validation_rules',
] as const;

export type OperationalLayer = typeof OPERATIONAL_LAYERS[number];

/** Query options for all layer requests */
export interface QueryOptions {
  limit?: number;
  offset?: number;
  fields?: string[];
}

/** Base API client - handles all HTTP communication */
export class DataModelClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? DATA_MODEL_BASE;
  }

  /** Health check */
  async health(): Promise<ApiHealth> {
    const res = await fetch(`${this.baseUrl}/health`);
    if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
    return res.json();
  }

  /** Get layer metadata (all layers or filtered) */
  async getLayerMetadata(operational?: boolean): Promise<LayerMetadata[]> {
    const url = operational
      ? `${this.baseUrl}/model/layer-metadata/?operational=true`
      : `${this.baseUrl}/model/layer-metadata/`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Layer metadata failed: ${res.status}`);
    const json = await res.json();
    return json.data as LayerMetadata[];
  }

  /** Query a layer with optional filters (fire-hose protection via limit) */
  async query<T>(
    layer: string,
    options: QueryOptions = {}
  ): Promise<ApiResponse<T>> {
    const { limit = 100, offset = 0, fields } = options;
    
    const params = new URLSearchParams();
    params.set('limit', limit.toString());
    if (offset > 0) params.set('offset', offset.toString());
    if (fields && fields.length > 0) params.set('fields', fields.join(','));

    const url = `${this.baseUrl}/model/${layer}/?${params.toString()}`;
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`Query ${layer} failed: ${res.status} ${res.statusText}`);
    }
    
    return res.json();
  }

  /** Get single object by ID */
  async getById<T>(layer: string, id: string): Promise<T> {
    const url = `${this.baseUrl}/model/${layer}/${id}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Get ${layer}/${id} failed: ${res.status}`);
    return res.json();
  }

  /** Get object count for a layer (fast endpoint) */
  async count(layer: string): Promise<number> {
    const url = `${this.baseUrl}/model/${layer}/count`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Count ${layer} failed: ${res.status}`);
    const json = await res.json();
    return json.count as number;
  }
}

// Singleton client instance
export const apiClient = new DataModelClient();
