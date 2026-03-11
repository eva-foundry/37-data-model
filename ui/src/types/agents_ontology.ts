// Agents Ontology layer types (L01 - agents_ontology)

import type { ModelObject } from './api';

export interface AgentsOntologyRecord extends ModelObject {
  // Identity
  id: string;
  label: string;
  label_fr: string;

  // Classification
  agent_type: string;
  domain: string;
  ontology_class: string;
  status: 'active' | 'planned' | 'deprecated' | 'archived';

  // Capabilities
  capabilities: string[];
  skills: string[];

  // Description
  description: string;
  notes: string;

  // Hierarchy
  parent_id: string | null;

  // Versioning
  version: string;
}

export type AgentsOntologyStatus = AgentsOntologyRecord['status'];

/** Input for creating a new agents ontology record */
export interface CreateAgentsOntologyRecordInput {
  id: string;
  label: string;
  label_fr: string;
  agent_type: string;
  domain: string;
  ontology_class: string;
  status: AgentsOntologyStatus;
  description: string;
  capabilities?: string[];
  skills?: string[];
  version?: string;
  parent_id?: string | null;
  notes?: string;
}

/** Input for updating an existing agents ontology record */
export interface UpdateAgentsOntologyRecordInput {
  id: string;
  label?: string;
  label_fr?: string;
  agent_type?: string;
  domain?: string;
  ontology_class?: string;
  status?: AgentsOntologyStatus;
  description?: string;
  capabilities?: string[];
  skills?: string[];
  version?: string;
  parent_id?: string | null;
  notes?: string;
}

/** View filters for agents ontology queries */
export interface AgentsOntologyFilters {
  domain?: string;
  agent_type?: string;
  ontology_class?: string;
  status?: AgentsOntologyStatus;
  active_only?: boolean;
  has_parent?: boolean;
}
