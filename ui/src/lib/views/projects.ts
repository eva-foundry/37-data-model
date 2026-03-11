// Project Views - Context-aware project queries
// Fire-hose protection: Returns filtered views, not all 56 projects

import { apiClient } from '../api/client';
import type { ProjectRecord, ProjectFilters, ProjectMaturityLevel } from '@/types/project';

/** Get all projects (fire-hose warning: returns all 56 objects) */
export async function getAllProjects(): Promise<ProjectRecord[]> {
  const response = await apiClient.query<ProjectRecord>('projects', { limit: 1000 });
  return response.data;
}

/** Get active projects only (is_active=true, status=active) */
export async function getActiveProjects(): Promise<ProjectRecord[]> {
  const all = await getAllProjects();
  return all.filter(p => 
    p.is_active === true && 
    p.status === 'active'
  );
}

/** Get projects by maturity level */
export async function getProjectsByMaturity(
  level: ProjectMaturityLevel
): Promise<ProjectRecord[]> {
  const all = await getAllProjects();
  return all.filter(p => p.maturity === level);
}

/** Get operational projects (maturity=active) */
export async function getOperationalProjects(): Promise<ProjectRecord[]> {
  return getProjectsByMaturity('active');
}

/** Get POC projects */
export async function getPocProjects(): Promise<ProjectRecord[]> {
  return getProjectsByMaturity('poc');
}

/** Get projects by category */
export async function getProjectsByCategory(category: string): Promise<ProjectRecord[]> {
  const all = await getAllProjects();
  return all.filter(p => 
    p.category.toLowerCase() === category.toLowerCase()
  );
}

/** Get projects currently in sprint (sprint_context !== null) */
export async function getProjectsInSprint(): Promise<ProjectRecord[]> {
  const all = await getAllProjects();
  return all.filter(p => p.sprint_context !== null);
}

/** Get blocked projects (blocked_by array not empty) */
export async function getBlockedProjects(): Promise<ProjectRecord[]> {
  const all = await getAllProjects();
  return all.filter(p => 
    Array.isArray(p.blocked_by) && p.blocked_by.length > 0
  );
}

/** Get projects with dependencies */
export async function getProjectsWithDependencies(): Promise<ProjectRecord[]> {
  const all = await getAllProjects();
  return all.filter(p => 
    Array.isArray(p.depends_on) && p.depends_on.length > 0
  );
}

/** Get projects for current workspace (assumes folder matches workspace pattern) */
export async function getCurrentWorkspaceProjects(
  workspacePath?: string
): Promise<ProjectRecord[]> {
  const all = await getAllProjects();
  
  if (!workspacePath) return all;
  
  // Extract workspace folder name from path (e.g., "eva-foundry" from "C:\eva-foundry")
  const workspaceName = workspacePath.split(/[/\\]/).pop()?.toLowerCase() || '';
  
  return all.filter(p => 
    p.folder?.toLowerCase().includes(workspaceName) ||
    p.github_repo?.toLowerCase().includes(workspaceName)
  );
}

/** Get projects by multiple filters (smart filtering) */
export async function getProjects(filters: ProjectFilters = {}): Promise<ProjectRecord[]> {
  let projects = await getAllProjects();
  
  if (filters.active_only) {
    projects = projects.filter(p => p.is_active === true);
  }
  
  if (filters.category) {
    projects = projects.filter(p => 
      p.category.toLowerCase() === filters.category!.toLowerCase()
    );
  }
  
  if (filters.maturity) {
    projects = projects.filter(p => p.maturity === filters.maturity);
  }
  
  if (filters.status) {
    projects = projects.filter(p => p.status === filters.status);
  }
  
  if (filters.in_sprint !== undefined) {
    projects = projects.filter(p => 
      filters.in_sprint 
        ? p.sprint_context !== null 
        : p.sprint_context === null
    );
  }
  
  if (filters.is_blocked !== undefined) {
    projects = projects.filter(p => {
      const hasBlockers = Array.isArray(p.blocked_by) && p.blocked_by.length > 0;
      return filters.is_blocked ? hasBlockers : !hasBlockers;
    });
  }
  
  return projects;
}

/** Get project by ID (exact match) */
export async function getProjectById(id: string): Promise<ProjectRecord | undefined> {
  try {
    return await apiClient.getById<ProjectRecord>('projects', id);
  } catch (error) {
    console.warn(`Project ${id} not found:`, error);
    return undefined;
  }
}

/** Get project count (fast endpoint) */
export async function getProjectCount(): Promise<number> {
  return apiClient.count('projects');
}

/** Default view: Active projects only (recommended for most UI screens) */
export async function getDefaultProjects(): Promise<ProjectRecord[]> {
  return getActiveProjects();
}
