/**
 * WBS API - Demo Mock
 * Session 46 - Bug #6 fix: Added fetchWBSTree, fetchCriticalPath
 */

import type { WBSTreeResponse, WBSNode, CriticalPathResponse, CriticalPathItem } from '@/types/scrum';

export interface WBSRecord {
  id: string;
  title: string;
  project_id: string;
  layer: string;
  [key: string]: any;
}

export interface CreateWBSRecordInput {
  id: string;
  title: string;
  project_id: string;
  [key: string]: any;
}

export const createWBSRecord = async (
  input: CreateWBSRecordInput
): Promise<WBSRecord> => {
  // Mock API call
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: 'L26',
    created_at: new Date().toISOString(),
  };
};

// Mock WBS tree for development
const MOCK_WBS_NODES: WBSNode[] = [
  {
    id: 'wbs-1',
    parentId: null,
    type: 'phase',
    title: 'EVA Platform Sprint 46',
    owner: 'Platform Team',
    status: 'In Progress',
    startDate: '2026-03-01',
    endDate: '2026-03-31',
    progress: 65,
    dependencies: [],
    children: [
      {
        id: 'wbs-1-1',
        parentId: 'wbs-1',
        type: 'epic',
        title: 'Data Model UI - Screens Machine',
        owner: 'Frontend Team',
        status: 'In Progress',
        startDate: '2026-03-01',
        endDate: '2026-03-15',
        progress: 80,
        dependencies: [],
      },
    ],
  },
];

const MOCK_CRITICAL_PATH: CriticalPathItem[] = [
  {
    id: 'cp-1',
    title: 'Generate 111 layer screens',
    duration_days: 1,
    nodeId: 'wbs-1-1',
  },
];

/**
 * Fetches WBS tree for a project.
 * Currently returns mock data. Future: Query Data Model API Layer 26 (wbs).
 */
export async function fetchWBSTree(projectId?: string): Promise<WBSTreeResponse> {
  await new Promise(resolve => setTimeout(resolve, 150));
  return { nodes: MOCK_WBS_NODES };
}

/**
 * Fetches critical path for a project.
 * Currently returns mock data. Future: Calculate from WBS dependencies.
 */
export async function fetchCriticalPath(projectId?: string): Promise<CriticalPathResponse> {
  await new Promise(resolve => setTimeout(resolve, 150));
  const total = MOCK_CRITICAL_PATH.reduce((sum, item) => sum + item.duration_days, 0);
  return {
    total_duration_days: total,
    items: MOCK_CRITICAL_PATH,
  };
}

export interface UpdateWBSRecordInput extends Partial<CreateWBSRecordInput> {
  id: string;
}

export const updateWBSRecord = async (
  input: UpdateWBSRecordInput
): Promise<WBSRecord> => {
  // Mock API call
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: 'L26',
    updated_at: new Date().toISOString(),
  } as WBSRecord;
};

// COMPATIBILITY EXPORTS: singular symbols + (id, input) update signature
export type WbsItemRecord = WBSRecord;
export type CreateWbsItemRecordInput = CreateWBSRecordInput;
export type UpdateWbsItemRecordInput = UpdateWBSRecordInput;

export const createWbsItemRecord = async (
  input: CreateWbsItemRecordInput
): Promise<WbsItemRecord> => {
  return createWBSRecord(input as CreateWBSRecordInput) as Promise<WbsItemRecord>;
};

export const updateWbsItemRecord = async (
  id: string,
  input: UpdateWbsItemRecordInput
): Promise<WbsItemRecord> => {
  const merged = { ...(input as Record<string, any>), id } as UpdateWBSRecordInput;
  return updateWBSRecord(merged) as Promise<WbsItemRecord>;
};
