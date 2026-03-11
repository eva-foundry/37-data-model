/**
 * ProjectPortfolioPage.test.tsx -- WI-PM-PLANE-1 unit tests (2026-02-25 15:20 ET)
 *
 * Acceptance: >= 5 tests, tsc exit 0, jest-axe 0 violations,
 * all strings via useLang t object (portal.projects.* keys).
 *
 * Mock strategy: vi.mock '@api/projectApi' -- no real fetch.
 * Wrapper: MemoryRouter + AuthProvider + LangProvider.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe } from 'jest-axe';
import { LangProvider } from '@context/LangContext';
import { AuthProvider } from '@context/AuthContext';
import { ProjectPortfolioPage } from './ProjectPortfolioPage';
import type { ProjectListResponse } from '@/types/project';

// ---------------------------------------------------------------------------
// Module mock
// ---------------------------------------------------------------------------

vi.mock('@api/projectApi', () => ({
  fetchProjects:       vi.fn(),
  USE_MOCK_PROJECTS:   false,
  MOCK_PROJECTS:       { refreshed_at: '', projects: [] },
}));

import { fetchProjects } from '@api/projectApi';
const mockFetchProjects = vi.mocked(fetchProjects);

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const MOCK_RESPONSE: ProjectListResponse = {
  refreshed_at: '2026-02-25T15:20:00Z',
  projects: [
    {
      id: '31-eva-faces', name: 'EVA Faces', maturity: 'active',
      stream: 'frontend', sprint: 'Sprint-7', pbi_total: 46, pbi_done: 38,
      description: 'Admin + chat + portal frontend',
    },
    {
      id: '20-assistme', name: 'AssistMe', maturity: 'poc',
      stream: 'frontend', sprint: null, pbi_total: 10, pbi_done: 2,
      description: 'Citizen-facing AI assistant POC',
    },
    {
      id: '37-data-model', name: 'EVA Data Model', maturity: 'active',
      stream: 'data', sprint: 'Sprint-7', pbi_total: 28, pbi_done: 27,
      description: 'Single source-of-truth API',
    },
  ],
};

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter initialEntries={['/portal/projects']}>
      <AuthProvider>
        <LangProvider>{children}</LangProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

function renderPage() {
  return render(<ProjectPortfolioPage />, { wrapper: Wrapper });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ProjectPortfolioPage (WI-PM-PLANE-1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchProjects.mockResolvedValue(MOCK_RESPONSE);
  });

  it('T01: renders page title', async () => {
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('portfolio-loading')).not.toBeInTheDocument());
    expect(screen.getByTestId('portfolio-title')).toHaveTextContent('Project Portfolio');
  });

  it('T02: shows loading state initially', () => {
    mockFetchProjects.mockReturnValue(new Promise(() => { /* never resolves */ }));
    renderPage();
    expect(screen.getByTestId('portfolio-loading')).toBeInTheDocument();
  });

  it('T03: renders project cards after load', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByTestId('project-card-31-eva-faces')).toBeInTheDocument());
    expect(screen.getByTestId('project-card-20-assistme')).toBeInTheDocument();
    expect(screen.getByTestId('project-card-37-data-model')).toBeInTheDocument();
  });

  it('T04: shows project count badge', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByTestId('portfolio-count')).toBeInTheDocument());
    expect(screen.getByTestId('portfolio-count')).toHaveTextContent('3');
  });

  it('T05: filter bar renders maturity + stream + sprint selects', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByTestId('portfolio-filter-bar')).toBeInTheDocument());
    expect(screen.getByTestId('filter-maturity')).toBeInTheDocument();
    expect(screen.getByTestId('filter-stream')).toBeInTheDocument();
    expect(screen.getByTestId('filter-sprint')).toBeInTheDocument();
  });

  it('T06: maturity filter reduces card count', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByTestId('portfolio-count')).toBeInTheDocument());
    fireEvent.change(screen.getByTestId('filter-maturity'), { target: { value: 'poc' } });
    await waitFor(() => expect(screen.getByTestId('portfolio-count')).toHaveTextContent('1'));
    expect(screen.getByTestId('project-card-20-assistme')).toBeInTheDocument();
  });

  it('T07: sprint filter yes shows only in-sprint projects', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByTestId('portfolio-count')).toBeInTheDocument());
    fireEvent.change(screen.getByTestId('filter-sprint'), { target: { value: 'yes' } });
    await waitFor(() => expect(screen.getByTestId('portfolio-count')).toHaveTextContent('2'));
  });

  it('T08: maturity badges are visible on cards', async () => {
    renderPage();
    await waitFor(() => expect(screen.getAllByTestId('maturity-badge-active')[0]).toBeInTheDocument());
    expect(screen.getByTestId('maturity-badge-poc')).toBeInTheDocument();
  });

  it('T09: error state is shown when fetch fails', async () => {
    mockFetchProjects.mockRejectedValue(new Error('Network error'));
    renderPage();
    await waitFor(() => expect(screen.getByTestId('portfolio-error')).toBeInTheDocument());
    expect(screen.getByTestId('portfolio-error')).toHaveTextContent('Failed to load projects');
  });

  it('T10: jest-axe -- 0 accessibility violations', async () => {
    const { container } = renderPage();
    await waitFor(() => expect(screen.queryByTestId('portfolio-loading')).not.toBeInTheDocument());
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
