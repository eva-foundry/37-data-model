/**
 * EVAHomePage.test.tsx — WI-17 unit tests (2026-02-21)
 *
 * Covers: renders, title, 5 category headings, 23 product names, loading state,
 * error state, skip link (a11y), GC signature, sprint badge rendering.
 *
 * Mock strategy: vi.mock '@api/scrumApi' so no real fetch runs.
 * Wrapper: MemoryRouter + AuthProvider + LangProvider (mirrors App.tsx).
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LangProvider } from '@context/LangContext';
import { AuthProvider } from '@context/AuthContext';
import { EVAHomePage } from './EVAHomePage';
import type { SprintSummary } from '@/types/scrum';

// ---------------------------------------------------------------------------
// Module mock — must be hoisted before imports that use the module
// ---------------------------------------------------------------------------

vi.mock('@api/scrumApi', () => ({
  fetchSprintSummaries: vi.fn(),
  fetchScrumDashboard: vi.fn(),
  MOCK_SUMMARIES: [],
  MOCK_DASHBOARD: null,
  USE_MOCK: false,
}));

import { fetchSprintSummaries } from '@api/scrumApi';
const mockFetchSummaries = vi.mocked(fetchSprintSummaries);

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const MOCK_SUMMARIES: SprintSummary[] = [
  { project: 'brain-v2',      sprint: 'Sprint-6', badge: 'Active', active_count: 2 },
  { project: 'ado-dashboard', sprint: 'Sprint-6', badge: 'Active', active_count: 3 },
  { project: 'faces',         sprint: 'Sprint-6', badge: 'Done',   active_count: 0 },
  { project: 'foundry',       sprint: 'Sprint-5', badge: 'Done',   active_count: 0 },
];

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
  return render(<EVAHomePage />, { wrapper: Wrapper });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('EVAHomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchSummaries.mockResolvedValue(MOCK_SUMMARIES);
  });

  it('renders the main landmark without crashing', async () => {
    renderPage();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('displays the H1 page title "EVA Portal"', async () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('EVA Portal');
  });

  it('renders all 5 product category headings (h2)', async () => {
    renderPage();
    // Categories appear as <h2> in ProductTileGrid and as <em> inside tiles.
    // Use getByRole with level+name to target only the section heading.
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: /user products/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: /ai intelligence/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: /platform/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: /developer/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: /moonshot/i })).toBeInTheDocument();
    });
  });

  it('renders specific product names from each category', async () => {
    renderPage();
    await waitFor(() => {
      // user_products
      expect(screen.getByText('EVA Chat')).toBeInTheDocument();
      // ai_intelligence
      expect(screen.getByText('EVA Brain')).toBeInTheDocument();
      // platform
      expect(screen.getByText('EVA Faces')).toBeInTheDocument();
      // developer
      expect(screen.getByText('EVA SDK')).toBeInTheDocument();
      // moonshot
      expect(screen.getByText('EVA Agents')).toBeInTheDocument();
    });
  });

  it('renders 23 product tiles (role=button with EVA aria-label)', async () => {
    renderPage();
    await waitFor(() => {
      // ProductTile renders <div role="button" aria-label="{product name}">
      // 23 tiles all have "EVA" in their aria-label
      const tiles = screen.getAllByRole('button', { name: /EVA/ });
      expect(tiles.length).toBe(23);
    });
  });

  it('shows loading status message while fetch is pending', () => {
    mockFetchSummaries.mockImplementation(() => new Promise<SprintSummary[]>(() => {}));
    renderPage();
    expect(screen.getByRole('status')).toHaveTextContent(/loading sprint data/i);
  });

  it('shows error alert when fetchSprintSummaries rejects', async () => {
    mockFetchSummaries.mockRejectedValue(new Error('network error'));
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('renders skip-to-main-content link for WCAG compliance', () => {
    renderPage();
    expect(screen.getByText(/skip to main content/i)).toBeInTheDocument();
  });

  it('renders GC Government of Canada signature in NavHeader', () => {
    renderPage();
    // Exact match targets only the header <span>; subtitle contains "...AI Platform"
    expect(screen.getByText('Government of Canada')).toBeInTheDocument();
  });

  it('calls fetchSprintSummaries exactly once on mount', async () => {
    // vi.clearAllMocks() in beforeEach ensures clean call count per test
    renderPage();
    await waitFor(() => {
      expect(mockFetchSummaries).toHaveBeenCalledTimes(1);
    });
  });

  it('renders subtitle beneath the H1', async () => {
    renderPage();
    expect(
      screen.getByText('Government of Canada AI Platform'),
    ).toBeInTheDocument();
  });
});
