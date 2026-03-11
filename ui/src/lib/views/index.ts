// Views Library - Context-aware queries for EVA Data Model
// Export all views for consumption by UI components

// Core API client
export { DataModelClient, apiClient, OPERATIONAL_LAYERS } from '../api/client';
export type { QueryOptions, OperationalLayer } from '../api/client';

// Types
export type { 
  ApiResponse, 
  Pagination, 
  ModelObject, 
  ApiHealth,
  LayerMetadata 
} from '@/types/api';

export type { 
  ProjectRecord, 
  ProjectFilters, 
  ProjectMaturityLevel,
  ProjectStatus 
} from '@/types/project';

export type { 
  SprintRecord, 
  SprintFilters, 
  SprintStatus 
} from '@/types/sprint';

export type { 
  EvidenceRecord, 
  EvidenceFilters, 
  EvidenceOutcome,
  EvidenceType 
} from '@/types/evidence';

export type { 
  EndpointRecord, 
  EndpointFilters, 
  EndpointStatus,
  HttpMethod 
} from '@/types/endpoint';

export type { 
  StoryRecord, 
  StoryFilters, 
  StoryStatus 
} from '@/types/story';

// Project views
export {
  getAllProjects,
  getActiveProjects,
  getProjectsByMaturity,
  getOperationalProjects,
  getPocProjects,
  getProjectsByCategory,
  getProjectsInSprint,
  getBlockedProjects,
  getProjectsWithDependencies,
  getCurrentWorkspaceProjects,
  getProjects,
  getProjectById,
  getProjectCount,
  getDefaultProjects,
} from './projects';

// Sprint views
export {
  getAllSprints,
  getActiveSprints,
  getSprintsByProject,
  getCurrentSprint,
  getCompletedSprints,
  getSprintsByStatus,
  getSprints,
  getSprintById,
  getSprintCount,
  getDefaultSprints,
} from './sprints';

// Evidence views
export {
  getAllEvidence,
  getRecentEvidence,
  getEvidenceByOperation,
  getEvidenceByProject,
  getEvidenceByOutcome,
  getFailedEvidence,
  getSuccessfulEvidence,
  getEvidenceByType,
  getEvidence,
  getEvidenceById,
  getEvidenceCount,
  getDefaultEvidence,
} from './evidence';

// Endpoint views
export {
  getAllEndpoints,
  getOperationalEndpoints,
  getStubEndpoints,
  getPlannedEndpoints,
  getEndpointsByService,
  getEndpointsByMethod,
  getEndpointsByStatus,
  getEndpointsWithCosmosReads,
  getEndpointsWithCosmosWrites,
  getAuthenticatedEndpoints,
  getEndpoints,
  getEndpointById,
  getEndpointCount,
  getDefaultEndpoints,
} from './endpoints';

// Story views
export {
  getAllStories,
  getActiveStories,
  getStoriesByProject,
  getStoriesBySprint,
  getStoriesByStatus,
  getBlockedStories,
  getBacklogStories,
  getCompletedStories,
  getStoriesByAssignee,
  getUnassignedStories,
  getStories,
  getStoryById,
  getStoryCount,
  getDefaultStories,
} from './stories';
