// Sprint Views - Context-aware sprint queries

import { apiClient } from '../api/client';
import type { SprintRecord, SprintFilters, SprintStatus } from '@/types/sprint';

/** Get all sprints */
export async function getAllSprints(): Promise<SprintRecord[]> {
  const response = await apiClient.query<SprintRecord>('sprints', { limit: 500 });
  return response.data;
}

/** Get active sprints only (status=active) */
export async function getActiveSprints(): Promise<SprintRecord[]> {
  const all = await getAllSprints();
  return all.filter(s => s.status === 'active');
}

/**Get sprints by project ID */
export async function getSprintsByProject(projectId: string): Promise<SprintRecord[]> {
  const all = await getAllSprints();
  return all.filter(s => s.project_id === projectId);
}

/** Get current sprint (most recent active sprint) */
export async function getCurrentSprint(projectId?: string): Promise<SprintRecord | undefined> {
  const sprints = projectId 
    ? await getSprintsByProject(projectId)
    : await getAllSprints();
  
  const active = sprints.filter(s => s.status === 'active');
  if (active.length === 0) return undefined;
  
  // Sort by start_date descending, return first
  return active.sort((a, b) => 
    new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
  )[0];
}

/** Get completed sprints */
export async function getCompletedSprints(projectId?: string): Promise<SprintRecord[]> {
  const sprints = projectId
    ? await getSprintsByProject(projectId)
    : await getAllSprints();
  
  return sprints.filter(s => s.status === 'completed');
}

/** Get sprints by status */
export async function getSprintsByStatus(status: SprintStatus): Promise<SprintRecord[]> {
  const all = await getAllSprints();
  return all.filter(s => s.status === status);
}

/** Get sprints with filters */
export async function getSprints(filters: SprintFilters = {}): Promise<SprintRecord[]> {
  let sprints = await getAllSprints();
  
  if (filters.project_id) {
    sprints = sprints.filter(s => s.project_id === filters.project_id);
  }
  
  if (filters.status) {
    sprints = sprints.filter(s => s.status === filters.status);
  }
  
  if (filters.active_only) {
    sprints = sprints.filter(s => s.status === 'active');
  }
  
  return sprints;
}

/** Get sprint by ID */
export async function getSprintById(id: string): Promise<SprintRecord | undefined> {
  try {
    return await apiClient.getById<SprintRecord>('sprints', id);
  } catch (error) {
    console.warn(`Sprint ${id} not found:`, error);
    return undefined;
  }
}

/** Get sprint count */
export async function getSprintCount(): Promise<number> {
  return apiClient.count('sprints');
}

/** Default view: Active sprints */
export async function getDefaultSprints(): Promise<SprintRecord[]> {
  return getActiveSprints();
}
