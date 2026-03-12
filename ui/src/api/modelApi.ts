// ─── EVA Data Model API client — portal-face ─────────────────────────────────
// Connects to 37-data-model API.
// Default: ACA endpoint (primary, 24x7, Cosmos-backed, no auth required).
// Override: set VITE_DATA_MODEL_URL in .env (e.g. http://localhost:8010 for local dev).
// ─────────────────────────────────────────────────────────────────────────────

const DATA_MODEL_BASE: string =
  (import.meta.env['VITE_DATA_MODEL_URL'] as string | undefined) ??
  'https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io';

// ── Ontology domain definition ───────────────────────────────────────────────
export interface OntologyDomain {
  layers: string[];
  start_here: string;
  common_queries: string[];
  cross_layer_queries: string[];
  note?: string;
}

export interface UserGuideDomains {
  [domainKey: string]: OntologyDomain;
}

export interface LayerFieldDef {
  name: string;
  type: string;
  required?: boolean;
  description?: string;
}

// ── Response shapes ──────────────────────────────────────────────────────────

export interface ModelHealth {
  status: string;
  service: string;
  version: string;
  store: string;
  cache: string;
  uptime_seconds?: number;
}

export interface ModelSummary {
  total: number;
  layers: Record<string, number>;
}

/** Generic model object — all layers share these audit fields */
export interface ModelObject {
  obj_id: string;
  layer: string;
  id: string;
  is_active?: boolean;
  row_version?: number;
  created_at?: string;
  created_by?: string;
  modified_at?: string;
  modified_by?: string;
  source_file?: string;
  // carry-all for layer-specific fields
  [key: string]: unknown;
}

export interface EndpointObject extends ModelObject {
  method?: string;
  path?: string;
  service?: string;
  status?: 'implemented' | 'stub' | 'planned' | 'coded';
  auth?: string[];
  auth_mode?: string;
  feature_flag?: string;
  implemented_in?: string;
  repo_line?: number;
  cosmos_reads?: string[];
  cosmos_writes?: string[];
}

export interface GraphNode {
  id: string;
  layer: string;
  label: string;
  status?: string;
}

export interface GraphEdge {
  from_id: string;
  from_layer: string;
  to_id: string;
  to_layer: string;
  edge_type: string;
  via_field?: string;
}

export interface GraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
  node_count: number;
  edge_count: number;
  depth?: number;
  duration_ms?: number;
}

export interface EdgeTypeMeta {
  edge_type: string;
  count: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string): Promise<T> {
  const url = `${DATA_MODEL_BASE}${path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`[model-api] ${res.status} ${res.statusText} — ${path}`);
  return res.json() as Promise<T>;
}

// ── Public API ───────────────────────────────────────────────────────────────

/** GET /health — liveness check */
export async function getHealth(): Promise<ModelHealth> {
  return apiFetch<ModelHealth>('/health');
}

/** GET /model/agent-summary — layer counts + total */
export async function getAgentSummary(): Promise<ModelSummary> {
  return apiFetch<ModelSummary>('/model/agent-summary');
}

/** GET /model/user-guide — extracts ontology_domains with 12-domain layer grouping */
export async function getUserGuideDomains(): Promise<UserGuideDomains> {
  const guide = await apiFetch<{
    category_instructions: {
      ontology_domains: { domains: UserGuideDomains };
    };
  }>('/model/user-guide');
  return guide.category_instructions.ontology_domains.domains;
}

/** GET /model/{layer}/fields — schema fields for a layer */
export async function getLayerFields(layer: string): Promise<LayerFieldDef[]> {
  return apiFetch<LayerFieldDef[]>(`/model/${encodeURIComponent(layer)}/fields`);
}

/** GET /model/{layer}/ — list all objects in a layer */
export async function listLayer(layer: string): Promise<ModelObject[]> {
  return apiFetch<ModelObject[]>(`/model/${layer}/`);
}

/** GET /model/{layer}/{id} — single object */
export async function getObject(layer: string, id: string): Promise<ModelObject> {
  return apiFetch<ModelObject>(`/model/${layer}/${encodeURIComponent(id)}`);
}

/** GET /model/endpoints/filter — filter endpoints by status, service, etc. */
export async function filterEndpoints(params: {
  status?: string;
  service?: string;
  cosmos_writes?: string;
  cosmos_reads?: string;
}): Promise<EndpointObject[]> {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v != null)) as Record<string, string>
  ).toString();
  return apiFetch<EndpointObject[]>(`/model/endpoints/filter${qs ? `?${qs}` : ''}`);
}

/** GET /model/graph — full node/edge graph */
export async function getGraph(params?: {
  node_id?: string;
  depth?: number;
  layer?: string;
}): Promise<GraphResponse> {
  const qs = params ? new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])) as Record<string, string>
  ).toString() : '';
  return apiFetch<GraphResponse>(`/model/graph${qs ? `?${qs}` : ''}`);
}

/** GET /model/graph/edge-types — edge type vocabulary */
export async function getEdgeTypes(): Promise<EdgeTypeMeta[]> {
  return apiFetch<EdgeTypeMeta[]>('/model/graph/edge-types');
}

/** GET /model/impact — cross-layer impact analysis for a container */
export async function getImpact(container: string): Promise<Record<string, unknown>> {
  return apiFetch<Record<string, unknown>>(`/model/impact/?container=${encodeURIComponent(container)}`);
}

/** Compute endpoint status breakdown grouped by service */
export function endpointStatusMatrix(endpoints: EndpointObject[]): {
  service: string;
  implemented: number;
  stub: number;
  planned: number;
  coded: number;
  total: number;
}[] {
  const map = new Map<string, { implemented: number; stub: number; planned: number; coded: number }>();

  for (const ep of endpoints) {
    const svc = ep.service ?? '(unknown)';
    if (!map.has(svc)) map.set(svc, { implemented: 0, stub: 0, planned: 0, coded: 0 });
    const row = map.get(svc)!;
    const st = (ep.status ?? 'stub') as keyof typeof row;
    if (st in row) row[st]++;
  }

  return Array.from(map.entries())
    .map(([service, counts]) => ({
      service,
      ...counts,
      total: counts.implemented + counts.stub + counts.planned + counts.coded,
    }))
    .sort((a, b) => b.total - a.total);
}
