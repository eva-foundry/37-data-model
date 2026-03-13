// Project Portfolio API -- portal-face
// Mock-first: returns static data when VITE_BRAIN_API_URL is absent.
// Real endpoint: GET /v1/projects (33-eva-brain-v2 PM Plane API)

import type { ProjectListResponse } from '@/types/project';

export const USE_MOCK_PROJECTS = !import.meta.env.VITE_BRAIN_API_URL;
const BASE = import.meta.env.VITE_BRAIN_API_URL ?? '';

export const MOCK_PROJECTS: ProjectListResponse = {
  refreshed_at: '2026-02-25T15:20:00Z',
  projects: [
    {
      id: '31-eva-faces', name: 'EVA Faces', maturity: 'active',
      stream: 'frontend', sprint: 'Sprint-7',
      pbi_total: 46, pbi_done: 38,
      description: 'Admin + chat + portal frontend',
    },
    {
      id: '33-eva-brain-v2', name: 'EVA Brain v2', maturity: 'active',
      stream: 'backend', sprint: 'Sprint-7',
      pbi_total: 34, pbi_done: 22,
      description: 'Agentic backend (FastAPI)',
    },
    {
      id: '37-data-model', name: 'EVA Data Model', maturity: 'active',
      stream: 'data', sprint: 'Sprint-7',
      pbi_total: 28, pbi_done: 27,
      description: 'Single source-of-truth API',
    },
    {
      id: '44-eva-jp-spark', name: 'EVA JP Spark', maturity: 'active',
      stream: 'frontend', sprint: 'Sprint-7',
      pbi_total: 32, pbi_done: 18,
      description: 'Bilingual GC AI assistant (Phase 3)',
    },
    {
      id: '48-eva-veritas', name: 'EVA Veritas', maturity: 'active',
      stream: 'data', sprint: 'Sprint-7',
      pbi_total: 16, pbi_done: 14,
      description: 'Zero-config requirements traceability',
    },
    {
      id: '20-assistme', name: 'AssistMe', maturity: 'poc',
      stream: 'frontend', sprint: null,
      pbi_total: 10, pbi_done: 2,
      description: 'Citizen-facing AI assistant POC',
    },
    {
      id: '22-rg-sandbox', name: 'RG Sandbox', maturity: 'active',
      stream: 'infra', sprint: null,
      pbi_total: 8, pbi_done: 4,
      description: 'Azure sandbox (18 resources)',
    },
    {
      id: '19-ai-gov', name: 'AI Governance', maturity: 'poc',
      stream: 'ai', sprint: null,
      pbi_total: 6, pbi_done: 0,
      description: 'AI governance policies and decision engine specs',
    },
  ],
};

export async function fetchProjects(): Promise<ProjectListResponse> {
  if (USE_MOCK_PROJECTS) return MOCK_PROJECTS;
  const res = await fetch(`${BASE}/v1/projects`);
  if (!res.ok) throw new Error(`GET /v1/projects: ${res.status}`);
  return res.json() as Promise<ProjectListResponse>;
}
