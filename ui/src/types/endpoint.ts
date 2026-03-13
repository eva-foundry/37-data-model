// Endpoint types (L11 - endpoints)

import type { ModelObject } from './api';

export interface EndpointRecord extends ModelObject {
  // Identity
  id: string;
  method: string;
  path: string;
  
  // Service association
  service: string;
  
  // Status
  status: 'implemented' | 'coded' | 'stub' | 'planned';
  
  // Security
  auth: string[];
  auth_mode?: string;
  feature_flag?: string;
  
  // Implementation
  implemented_in?: string;
  repo_path?: string;
  repo_line?: number;
  
  // Data access
  cosmos_reads?: string[];
  cosmos_writes?: string[];
  
  // Documentation
  description?: string;
  notes?: string;
}

export type EndpointStatus = EndpointRecord['status'];
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface EndpointFilters {
  service?: string;
  status?: EndpointStatus;
  method?: HttpMethod;
  operational_only?: boolean;
}
