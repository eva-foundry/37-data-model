// WBS Tree API -- portal-face
// Mock-first: returns static tree when VITE_BRAIN_API_URL is absent.
// Real endpoints: GET /v1/wbs, GET /v1/wbs/critical-path (33-eva-brain-v2)

import type { WBSTreeResponse, CriticalPathResponse } from '@/types/scrum';

export const USE_MOCK_WBS = !import.meta.env.VITE_BRAIN_API_URL;
const BASE = import.meta.env.VITE_BRAIN_API_URL ?? '';

export const MOCK_WBS_TREE: WBSTreeResponse = {
  project_id: '31-eva-faces',
  refreshed_at: '2026-02-25T15:20:00Z',
  nodes: [
    { id: 'ph1', parent_id: null, type: 'phase', title: 'Phase 1 -- Shared Libraries', level: 0, is_locked: false, sprint: null },
    { id: 'ep1', parent_id: 'ph1', type: 'epic',    title: 'Design System',                 level: 1, is_locked: false, sprint: 'Sprint-5' },
    { id: 'f1',  parent_id: 'ep1', type: 'feature', title: 'GC Design System tokens',       level: 2, is_locked: false, sprint: 'Sprint-5' },
    { id: 'f1b', parent_id: 'ep1', type: 'feature', title: '@eva/ui 14 wrappers',            level: 2, is_locked: false, sprint: 'Sprint-5' },
    { id: 'ph2', parent_id: null, type: 'phase', title: 'Phase 2 -- Admin Screens',          level: 0, is_locked: false, sprint: null },
    { id: 'ep2', parent_id: 'ph2', type: 'epic',    title: 'Admin UI',                      level: 1, is_locked: false, sprint: 'Sprint-6' },
    { id: 'f2',  parent_id: 'ep2', type: 'feature', title: 'PortalShell (WI-SHELL-1)',       level: 2, is_locked: false, sprint: 'Sprint-7' },
    { id: 'f3',  parent_id: 'ep2', type: 'feature', title: '10 Admin Screens WI-1 thru WI-16', level: 2, is_locked: false, sprint: 'Sprint-6' },
    { id: 'f4',  parent_id: 'ep2', type: 'feature', title: 'Admin API wiring (WI-20)',       level: 2, is_locked: false, sprint: 'Sprint-7' },
    { id: 'ph3', parent_id: null, type: 'phase', title: 'Phase 3 -- Chat UI',                level: 0, is_locked: true,  sprint: null },
    { id: 'ep3', parent_id: 'ph3', type: 'epic',    title: 'Chat Interface',                 level: 1, is_locked: true,  sprint: 'Sprint-8' },
    { id: 'f5',  parent_id: 'ep3', type: 'feature', title: 'Chat streaming',                 level: 2, is_locked: true,  sprint: 'Sprint-8' },
    { id: 'ph4', parent_id: null, type: 'phase', title: 'Phase 4 -- Testing & Deployment',   level: 0, is_locked: true,  sprint: null },
  ],
};

export const MOCK_CRITICAL_PATH: CriticalPathResponse = {
  project_id: '31-eva-faces',
  refreshed_at: '2026-02-25T15:20:00Z',
  items: [
    { wi_tag: 'CP-1', title: 'PortalShell complete',     sprint: 'Sprint-7', is_gate_passing: true,  node_id: 'f2' },
    { wi_tag: 'CP-2', title: 'Admin API wiring (WI-20)', sprint: 'Sprint-7', is_gate_passing: false, node_id: 'f4' },
    { wi_tag: 'CP-3', title: 'Chat streaming live',      sprint: 'Sprint-8', is_gate_passing: false, node_id: 'f5' },
    { wi_tag: 'CP-4', title: 'E2E Playwright suite',     sprint: 'Sprint-8', is_gate_passing: false, node_id: 'ph4' },
  ],
};

export async function fetchWBSTree(projectId: string): Promise<WBSTreeResponse> {
  if (USE_MOCK_WBS) return { ...MOCK_WBS_TREE, project_id: projectId };
  const res = await fetch(`${BASE}/v1/wbs?project_id=${projectId}`);
  if (!res.ok) throw new Error(`GET /v1/wbs: ${res.status}`);
  return res.json() as Promise<WBSTreeResponse>;
}

export async function fetchCriticalPath(projectId: string): Promise<CriticalPathResponse> {
  if (USE_MOCK_WBS) return { ...MOCK_CRITICAL_PATH, project_id: projectId };
  const res = await fetch(`${BASE}/v1/wbs/critical-path?project_id=${projectId}`);
  if (!res.ok) throw new Error(`GET /v1/wbs/critical-path: ${res.status}`);
  return res.json() as Promise<CriticalPathResponse>;
}
