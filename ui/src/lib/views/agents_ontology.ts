// Agents Ontology Views - Context-aware queries for L01 layer

import { apiClient } from '../api/client';
import type {
  AgentsOntologyRecord,
  AgentsOntologyFilters,
  AgentsOntologyStatus,
} from '@/types/agents_ontology';

/** Get all agents ontology records */
export async function getAllAgentsOntology(): Promise<AgentsOntologyRecord[]> {
  const response = await apiClient.query<AgentsOntologyRecord>(
    'agents_ontology',
    { limit: 500 }
  );
  return response.data;
}

/** Get active agents ontology records (is_active=true, status=active) */
export async function getActiveAgentsOntology(): Promise<AgentsOntologyRecord[]> {
  const all = await getAllAgentsOntology();
  return all.filter(
    (r) => r.is_active === true && r.status === 'active'
  );
}

/** Get agents ontology records by domain */
export async function getAgentsOntologyByDomain(
  domain: string
): Promise<AgentsOntologyRecord[]> {
  const all = await getAllAgentsOntology();
  return all.filter(
    (r) => r.domain.toLowerCase() === domain.toLowerCase()
  );
}

/** Get agents ontology records by type */
export async function getAgentsOntologyByType(
  agentType: string
): Promise<AgentsOntologyRecord[]> {
  const all = await getAllAgentsOntology();
  return all.filter(
    (r) => r.agent_type.toLowerCase() === agentType.toLowerCase()
  );
}

/** Get agents ontology records by ontology class */
export async function getAgentsOntologyByClass(
  ontologyClass: string
): Promise<AgentsOntologyRecord[]> {
  const all = await getAllAgentsOntology();
  return all.filter(
    (r) => r.ontology_class.toLowerCase() === ontologyClass.toLowerCase()
  );
}

/** Get agents ontology records by status */
export async function getAgentsOntologyByStatus(
  status: AgentsOntologyStatus
): Promise<AgentsOntologyRecord[]> {
  const all = await getAllAgentsOntology();
  return all.filter((r) => r.status === status);
}

/** Get top-level agents ontology records (no parent) */
export async function getRootAgentsOntology(): Promise<AgentsOntologyRecord[]> {
  const all = await getAllAgentsOntology();
  return all.filter((r) => !r.parent_id);
}

/** Get child records for a given parent */
export async function getAgentsOntologyChildren(
  parentId: string
): Promise<AgentsOntologyRecord[]> {
  const all = await getAllAgentsOntology();
  return all.filter((r) => r.parent_id === parentId);
}

/** Get agents ontology record by ID */
export async function getAgentsOntologyById(
  id: string
): Promise<AgentsOntologyRecord | undefined> {
  try {
    return await apiClient.getById<AgentsOntologyRecord>(
      'agents_ontology',
      id
    );
  } catch (error) {
    console.warn(`AgentsOntology ${id} not found:`, error);
    return undefined;
  }
}

/** Get total agents ontology record count */
export async function getAgentsOntologyCount(): Promise<number> {
  return apiClient.count('agents_ontology');
}

/** Get records with a specific capability */
export async function getAgentsOntologyByCapability(
  capability: string
): Promise<AgentsOntologyRecord[]> {
  const all = await getAllAgentsOntology();
  return all.filter(
    (r) =>
      Array.isArray(r.capabilities) &&
      r.capabilities.some((c) =>
        c.toLowerCase().includes(capability.toLowerCase())
      )
  );
}

/** Apply multiple filters to records */
export async function getAgentsOntology(
  filters: AgentsOntologyFilters = {}
): Promise<AgentsOntologyRecord[]> {
  let records = await getAllAgentsOntology();

  if (filters.active_only) {
    records = records.filter((r) => r.is_active === true);
  }

  if (filters.domain) {
    records = records.filter(
      (r) => r.domain.toLowerCase() === filters.domain!.toLowerCase()
    );
  }

  if (filters.agent_type) {
    records = records.filter(
      (r) =>
        r.agent_type.toLowerCase() === filters.agent_type!.toLowerCase()
    );
  }

  if (filters.ontology_class) {
    records = records.filter(
      (r) =>
        r.ontology_class.toLowerCase() ===
        filters.ontology_class!.toLowerCase()
    );
  }

  if (filters.status) {
    records = records.filter((r) => r.status === filters.status);
  }

  if (filters.has_parent !== undefined) {
    records = records.filter((r) =>
      filters.has_parent ? !!r.parent_id : !r.parent_id
    );
  }

  return records;
}

/** Default view: active agents ontology records */
export async function getDefaultAgentsOntology(): Promise<
  AgentsOntologyRecord[]
> {
  return getActiveAgentsOntology();
}
