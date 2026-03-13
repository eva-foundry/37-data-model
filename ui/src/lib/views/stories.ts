// Story Views - Context-aware story queries

import { apiClient } from '../api/client';
import type { StoryRecord, StoryFilters, StoryStatus } from '@/types/story';

/** Get all stories */
export async function getAllStories(): Promise<StoryRecord[]> {
  const response = await apiClient.query<StoryRecord>('stories', { limit: 500 });
  return response.data;
}

/** Get active stories (status=in_progress) */
export async function getActiveStories(): Promise<StoryRecord[]> {
  const all = await getAllStories();
  return all.filter(s => s.status === 'in_progress');
}

/** Get stories by project */
export async function getStoriesByProject(projectId: string): Promise<StoryRecord[]> {
  const all = await getAllStories();
  return all.filter(s => s.project_id === projectId);
}

/** Get stories by sprint */
export async function getStoriesBySprint(sprintId: string): Promise<StoryRecord[]> {
  const all = await getAllStories();
  return all.filter(s => s.sprint_id === sprintId);
}

/** Get stories by status */
export async function getStoriesByStatus(status: StoryStatus): Promise<StoryRecord[]> {
  const all = await getAllStories();
  return all.filter(s => s.status === status);
}

/** Get blocked stories */
export async function getBlockedStories(): Promise<StoryRecord[]> {
  const all = await getAllStories();
  return all.filter(s => 
    s.status === 'blocked' || 
    (Array.isArray(s.blocked_by) && s.blocked_by.length > 0)
  );
}

/** Get backlog stories (status=backlog) */
export async function getBacklogStories(projectId?: string): Promise<StoryRecord[]> {
  const stories = projectId 
    ? await getStoriesByProject(projectId)
    : await getAllStories();
  
  return stories.filter(s => s.status === 'backlog');
}

/** Get completed stories */
export async function getCompletedStories(projectId?: string): Promise<StoryRecord[]> {
  const stories = projectId
    ? await getStoriesByProject(projectId)
    : await getAllStories();
  
  return stories.filter(s => s.status === 'completed');
}

/** Get stories assigned to user */
export async function getStoriesByAssignee(assignee: string): Promise<StoryRecord[]> {
  const all = await getAllStories();
  return all.filter(s => s.assigned_to === assignee);
}

/** Get unassigned stories */
export async function getUnassignedStories(projectId?: string): Promise<StoryRecord[]> {
  const stories = projectId
    ? await getStoriesByProject(projectId)
    : await getAllStories();
  
  return stories.filter(s => !s.assigned_to || s.assigned_to === '');
}

/** Get stories with filters */
export async function getStories(filters: StoryFilters = {}): Promise<StoryRecord[]> {
  let stories = await getAllStories();
  
  if (filters.project_id) {
    stories = stories.filter(s => s.project_id === filters.project_id);
  }
  
  if (filters.sprint_id) {
    stories = stories.filter(s => s.sprint_id === filters.sprint_id);
  }
  
  if (filters.status) {
    stories = stories.filter(s => s.status === filters.status);
  }
  
  if (filters.assigned_to) {
    stories = stories.filter(s => s.assigned_to === filters.assigned_to);
  }
  
  if (filters.active_only) {
    stories = stories.filter(s => 
      s.status === 'in_progress' || s.status === 'planned'
    );
  }
  
  return stories;
}

/** Get story by ID */
export async function getStoryById(id: string): Promise<StoryRecord | undefined> {
  try {
    return await apiClient.getById<StoryRecord>('stories', id);
  } catch (error) {
    console.warn(`Story ${id} not found:`, error);
    return undefined;
  }
}

/** Get story count */
export async function getStoryCount(): Promise<number> {
  return apiClient.count('stories');
}

/** Default view: Active stories */
export async function getDefaultStories(): Promise<StoryRecord[]> {
  return getActiveStories();
}
