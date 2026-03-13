// Endpoint Views - Context-aware endpoint queries

import { apiClient } from '../api/client';
import type { EndpointRecord, EndpointFilters, HttpMethod } from '@/types/endpoint';

/** Get all endpoints (fire-hose warning: 187 objects) */
export async function getAllEndpoints(): Promise<EndpointRecord[]> {
  const response = await apiClient.query<EndpointRecord>('endpoints', { limit: 500 });
  return response.data;
}

/** Get operational endpoints (status=implemented or coded) */
export async function getOperationalEndpoints(): Promise<EndpointRecord[]> {
  const all = await getAllEndpoints();
  return all.filter(e => 
    e.status === 'implemented' || e.status === 'coded'
  );
}

/** Get stub endpoints (status=stub) */
export async function getStubEndpoints(): Promise<EndpointRecord[]> {
  const all = await getAllEndpoints();
  return all.filter(e => e.status === 'stub');
}

/** Get planned endpoints (status=planned) */
export async function getPlannedEndpoints(): Promise<EndpointRecord[]> {
  const all = await getAllEndpoints();
  return all.filter(e => e.status === 'planned');
}

/** Get endpoints by service */
export async function getEndpointsByService(service: string): Promise<EndpointRecord[]> {
  const all = await getAllEndpoints();
  return all.filter(e => 
    e.service.toLowerCase() === service.toLowerCase()
  );
}

/** Get endpoints by HTTP method */
export async function getEndpointsByMethod(method: HttpMethod): Promise<EndpointRecord[]> {
  const all = await getAllEndpoints();
  return all.filter(e => e.method.toUpperCase() === method);
}

/** Get endpoints by status */
export async function getEndpointsByStatus(
  status: EndpointRecord['status']
): Promise<EndpointRecord[]> {
  const all = await getAllEndpoints();
  return all.filter(e => e.status === status);
}

/** Get endpoints that read from Cosmos */
export async function getEndpointsWithCosmosReads(): Promise<EndpointRecord[]> {
  const all = await getAllEndpoints();
  return all.filter(e => 
    Array.isArray(e.cosmos_reads) && e.cosmos_reads.length > 0
  );
}

/** Get endpoints that write to Cosmos */
export async function getEndpointsWithCosmosWrites(): Promise<EndpointRecord[]> {
  const all = await getAllEndpoints();
  return all.filter(e => 
    Array.isArray(e.cosmos_writes) && e.cosmos_writes.length > 0
  );
}

/** Get endpoints with authentication required */
export async function getAuthenticatedEndpoints(): Promise<EndpointRecord[]> {
  const all = await getAllEndpoints();
  return all.filter(e => 
    Array.isArray(e.auth) && e.auth.length > 0
  );
}

/** Get endpoints with filters */
export async function getEndpoints(filters: EndpointFilters = {}): Promise<EndpointRecord[]> {
  let endpoints = await getAllEndpoints();
  
  if (filters.service) {
    endpoints = endpoints.filter(e => 
      e.service.toLowerCase() === filters.service!.toLowerCase()
    );
  }
  
  if (filters.status) {
    endpoints = endpoints.filter(e => e.status === filters.status);
  }
  
  if (filters.method) {
    endpoints = endpoints.filter(e => e.method.toUpperCase() === filters.method);
  }
  
  if (filters.operational_only) {
    endpoints = endpoints.filter(e => 
      e.status === 'implemented' || e.status === 'coded'
    );
  }
  
  return endpoints;
}

/** Get endpoint by ID */
export async function getEndpointById(id: string): Promise<EndpointRecord | undefined> {
  try {
    return await apiClient.getById<EndpointRecord>('endpoints', id);
  } catch (error) {
    console.warn(`Endpoint ${id} not found:`, error);
    return undefined;
  }
}

/** Get endpoint count */
export async function getEndpointCount(): Promise<number> {
  return apiClient.count('endpoints');
}

/** Default view: Operational endpoints */
export async function getDefaultEndpoints(): Promise<EndpointRecord[]> {
  return getOperationalEndpoints();
}
