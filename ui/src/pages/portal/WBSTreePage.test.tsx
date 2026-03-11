/**
 * WBSTreePage.test.tsx -- WI-PM-PLANE-2 unit tests (2026-02-25 15:20 ET)
 *
 * Acceptance: >= 5 tests, tsc exit 0, jest-axe 0 violations,
 * all strings via useLang (portal.wbs.* keys).
 *
 * Mock strategy: vi.mock '@api/wbsApi' -- no real fetch.
 * Wrapper: MemoryRouter + AuthProvider + LangProvider.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe } from 'jest-axe';
import { LangProvider } from '@context/LangContext';
import { AuthProvider } from '@context/AuthContext';
import { WBSTreePage } from './WBSTreePage';
import type { WBSTreeResponse, CriticalPathResponse } from '@/types/scrum';

// ---------------------------------------------------------------------------
// Module mock
// ---------------------------------------------------------------------------

vi.mock('@api/wbsApi', () => ({
  fetchWBSTree:         vi.fn(),
  fetchCriticalPath:    vi.fn(),
  USE_MOCK_WBS:         false,
  MOCK_WBS_TREE:        { project_id: '', refreshed_at: '', nodes: [] },
  MOCK_CRITICAL_PATH:   { project_id: '', refreshed_at: '', items: [] },
}));

import { fetchWBSTree, fetchCriticalPath } from '@api/wbsApi';
const mockFetchWBS  = vi.mocked(fetchWBSTree);
const mockFetchCrit = vi.mocked(fetchCriticalPath);

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const MOCK_WBS: WBSTreeResponse = {
  project_id: '31-eva-faces',
  refreshed_at: '2026-02-25T15:20:00Z',
  nodes: [
    { id: 'ph1', parent_id: null, type: 'phase', title: 'Phase 1', level: 0, is_locked: false, sprint: null },
    { id: 'ep1', parent_id: 'ph1', type: 'epic', title: 'Design System', level: 1, is_locked: false, sprint: 'Sprint-5' },
    { id: 'ph2', parent_id: null, type: 'phase', title: 'Phase 2', level: 0, is_locked: false, sprint: null },
    { id: 'ph3', parent_id: null, type: 'phase', title: 'Phase 3 -- Chat UI', level: 0, is_locked: true, sprint: null },
    { id: 'ep3', parent_id: 'ph3', type: 'epic', title: 'Chat Interface', level: 1, is_locked: true, sprint: 'Sprint-8' },
  ],
};

const MOCK_CRIT: CriticalPathResponse = {
  project_id: '31-eva-faces',
  refreshed_at: '2026-02-25T15:20:00Z',
  items: [
    { wi_tag: 'CP-1', title: 'PortalShell complete', sprint: 'Sprint-7', is_gate_passing: true,  node_id: 'ep1' },
    { wi_tag: 'CP-2', title: 'Admin API wiring',     sprint: 'Sprint-7', is_gate_passing: false, node_id: 'ph2' },
  ],
};

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter initialEntries={['/portal/wbs']}>
      <AuthProvider>
        <LangProvider>{children}</LangProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

function renderPage() {
  return render(<WBSTreePage />, { wrapper: Wrapper });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('WBSTreePage (WI-PM-PLANE-2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchWBS.mockResolvedValue(MOCK_WBS);
    mockFetchCrit.mockResolvedValue(MOCK_CRIT);
  });

  it('T01: renders page title', async () => {
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('wbs-loading')).not.toBeInTheDocument());
    expect(screen.getByTestId('wbs-title')).toHaveTextContent('Work Breakdown Structure');
  });

  it('T02: shows loading spinner initially', () => {
    mockFetchWBS.mockReturnValue(new Promise(() => { /* pending */ }));
    mockFetchCrit.mockReturnValue(new Promise(() => { /* pending */ }));
    renderPage();
    expect(screen.getByTestId('wbs-loading')).toBeInTheDocument();
  });

  it('T03: renders visible WBS nodes after load', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByTestId('wbs-tree')).toBeInTheDocument());
    // Top-level phases are expanded by default
    expect(screen.getByTestId('wbs-row-ph1')).toBeInTheDocument();
    expect(screen.getByTestId('wbs-row-ph2')).toBeInTheDocument();
    expect(screen.getByTestId('wbs-row-ph3')).toBeInTheDocument();
  });

  it('T04: expand/collapse toggle hides children', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByTestId('wbs-tree')).toBeInTheDocument());
    // ep1 is child of ph1 which is expanded -- visible initially
    expect(screen.getByTestId('wbs-row-ep1')).toBeInTheDocument();
    // Collapse ph1
    fireEvent.click(screen.getByTestId('wbs-toggle-ph1'));
    await waitFor(() => expect(screen.queryByTestId('wbs-row-ep1')).not.toBeInTheDocument());
  });

  it('T05: locked nodes show lock icon', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByTestId('wbs-tree')).toBeInTheDocument());
    // ph3 is locked
    expect(screen.getByTestId('wbs-lock-ph3')).toBeInTheDocument();
  });

  it('T06: critical path panel renders with items', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByTestId('critical-path-panel')).toBeInTheDocument());
    expect(screen.getByTestId('critical-path-title')).toHaveTextContent('Critical Path');
    expect(screen.getByTestId('crit-item-ep1')).toBeInTheDocument();
    expect(screen.getByTestId('crit-item-ph2')).toBeInTheDocument();
  });

  it('T07: gate badges show pass/fail correctly', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByTestId('crit-gate-ep1')).toBeInTheDocument());
    expect(screen.getByTestId('crit-gate-ep1')).toHaveTextContent('Gate pass');
    expect(screen.getByTestId('crit-gate-ph2')).toHaveTextContent('Gate fail');
  });

  it('T08: error state is shown when fetch fails', async () => {
    mockFetchWBS.mockRejectedValue(new Error('Timeout'));
    mockFetchCrit.mockResolvedValue(MOCK_CRIT);
    renderPage();
    await waitFor(() => expect(screen.getByTestId('wbs-error')).toBeInTheDocument());
    expect(screen.getByTestId('wbs-error')).toHaveTextContent('Failed to load WBS');
  });

  it('T09: expand-all and collapse-all buttons work', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByTestId('wbs-tree')).toBeInTheDocument());
    // Collapse all
    fireEvent.click(screen.getByTestId('wbs-collapse-all'));
    await waitFor(() => expect(screen.queryByTestId('wbs-row-ep1')).not.toBeInTheDocument());
    // Expand all
    fireEvent.click(screen.getByTestId('wbs-expand-all'));
    await waitFor(() => expect(screen.getByTestId('wbs-row-ep1')).toBeInTheDocument());
  });

  it('T10: jest-axe -- 0 accessibility violations', async () => {
    const { container } = renderPage();
    await waitFor(() => expect(screen.queryByTestId('wbs-loading')).not.toBeInTheDocument());
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
