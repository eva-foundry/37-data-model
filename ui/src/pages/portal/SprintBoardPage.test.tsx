/**
 * SprintBoardPage.test.tsx — WI-18 unit tests (2026-02-21)
 *
 * Covers: renders, title, feature sections, WI cards, detail drawer (open/close),
 * sprint selector, project filter bar, loading state, error state.
 *
 * Mock strategy: vi.mock '@api/scrumApi' — deterministic test data, no fetch.
 * Wrapper: MemoryRouter + AuthProvider + LangProvider (mirrors App.tsx).
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LangProvider } from '@context/LangContext';
import { AuthProvider } from '@context/AuthContext';
import { SprintBoardPage } from './SprintBoardPage';
import type { ScrumDashboardResponse } from '@/types/scrum';

// ---------------------------------------------------------------------------
// Module mock — hoisted before import resolution
// ---------------------------------------------------------------------------

vi.mock('@api/scrumApi', () => ({
  fetchScrumDashboard: vi.fn(),
  fetchSprintSummaries: vi.fn(),
  MOCK_DASHBOARD: null,
  MOCK_SUMMARIES: [],
  USE_MOCK: false,
}));

import { fetchScrumDashboard } from '@api/scrumApi';
const mockFetchDashboard = vi.mocked(fetchScrumDashboard);

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const MOCK_RESPONSE: ScrumDashboardResponse = {
  refreshed_at: '2026-02-21T12:00:00Z',
  epic: {
    id: 4,
    title: 'EVA Platform',
    features: [
      {
        id: 1,
        title: 'ADO Dashboard Feature',
        project: 'ado-dashboard',
        work_items: [
          {
            ado_id: 101,
            wi_tag: 'WI-0',
            title: 'eva-brain /v1/scrum/dashboard endpoint',
            sprint: 'Sprint-6',
            state: 'Active',
            dod: 'Endpoint live and returning shaped data.',
            test_count: 3,
            coverage_pct: 85,
            closed_at: null,
            entities_affected: ['ScrumCache'],
          },
          {
            ado_id: 102,
            wi_tag: 'WI-1',
            title: 'APIM route registration',
            sprint: 'Sprint-6',
            state: 'New',
            dod: 'Route live in APIM.',
            test_count: null,
            coverage_pct: null,
            closed_at: '2026-02-15T00:00:00Z',
            entities_affected: [],
          },
        ],
      },
      {
        id: 2,
        title: 'Brain v2 Feature',
        project: 'brain-v2',
        work_items: [
          {
            ado_id: 201,
            wi_tag: 'BRAIN-1',
            title: 'Chat endpoint v2',
            sprint: 'Sprint-5',
            state: 'Resolved',
            dod: 'Streaming endpoint verified.',
            test_count: 12,
            coverage_pct: 91,
            closed_at: '2026-02-10T00:00:00Z',
            entities_affected: ['BrainRoute'],
          },
        ],
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// Test wrapper
// ---------------------------------------------------------------------------

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter>
      <AuthProvider>
        <LangProvider>{children}</LangProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

function renderPage() {
  return render(<SprintBoardPage />, { wrapper: Wrapper });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SprintBoardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchDashboard.mockResolvedValue(MOCK_RESPONSE);
  });

  it('renders the main landmark without crashing', async () => {
    renderPage();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('displays the H1 page title "Sprint Board"', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Sprint Board');
  });

  it('renders feature section headings after data loads', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('ADO Dashboard Feature')).toBeInTheDocument();
      expect(screen.getByText('Brain v2 Feature')).toBeInTheDocument();
    });
  });

  it('renders WI cards with wi_tags', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('WI-0')).toBeInTheDocument();
      expect(screen.getByText('WI-1')).toBeInTheDocument();
      expect(screen.getByText('BRAIN-1')).toBeInTheDocument();
    });
  });

  it('clicking a WI card opens the WIDetailDrawer', async () => {
    renderPage();
    await waitFor(() => screen.getByText('WI-0'));

    const wiCard = screen.getByRole('button', { name: /WI-0/ });
    fireEvent.click(wiCard);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('pressing Escape closes the WIDetailDrawer', async () => {
    renderPage();
    await waitFor(() => screen.getByText('WI-0'));

    fireEvent.click(screen.getByRole('button', { name: /WI-0/ }));
    await waitFor(() => screen.getByRole('dialog'));

    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('renders sprint selector control', async () => {
    renderPage();
    await waitFor(() => {
      // SprintSelector renders a <select> element
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });

  it('renders project filter bar with All projects option', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /all/i })).toBeInTheDocument();
    });
  });

  it('shows loading status while fetch is pending', () => {
    mockFetchDashboard.mockImplementation(
      () => new Promise<ScrumDashboardResponse>(() => {}),
    );
    renderPage();
    expect(screen.getByRole('status')).toHaveTextContent(/loading sprint data/i);
  });

  it('shows error alert when fetchScrumDashboard rejects', async () => {
    mockFetchDashboard.mockRejectedValue(new Error('network error'));
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('calls fetchScrumDashboard with default params on mount', async () => {
    renderPage();
    await waitFor(() => {
      expect(mockFetchDashboard).toHaveBeenCalledWith(
        expect.objectContaining({ project: 'all', sprint: 'all' }),
      );
    });
  });

  it('renders WI title text from cards', async () => {
    renderPage();
    await waitFor(() => {
      expect(
        screen.getByText('eva-brain /v1/scrum/dashboard endpoint'),
      ).toBeInTheDocument();
    });
  });

  it('renders skip-to-main-content link for WCAG compliance', () => {
    renderPage();
    expect(screen.getByText(/skip to main content/i)).toBeInTheDocument();
  });
});
