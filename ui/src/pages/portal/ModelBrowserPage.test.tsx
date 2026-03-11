/**
 * ModelBrowserPage.test.tsx -- WI-MODEL-1 unit tests (2026-02-25)
 *
 * Acceptance: >= 5 tests, tsc exit 0, jest-axe 0 violations,
 * all strings via useLang t object, NavHeader /model link present.
 *
 * Mock strategy: vi.mock '@api/modelApi' -- no real fetch.
 * Wrapper: MemoryRouter + AuthProvider + LangProvider (mirrors App.tsx).
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe } from 'jest-axe';
import { LangProvider } from '@context/LangContext';
import { AuthProvider } from '@context/AuthContext';
import { ModelBrowserPage } from './ModelBrowserPage';
import type { ModelHealth, ModelSummary, ModelObject } from '@api/modelApi';

// ---------------------------------------------------------------------------
// Module mock -- hoisted before import resolution
// ---------------------------------------------------------------------------

vi.mock('@api/modelApi', () => ({
  getHealth:        vi.fn(),
  getAgentSummary:  vi.fn(),
  listLayer:        vi.fn(),
}));

import { getHealth, getAgentSummary, listLayer } from '@api/modelApi';
const mockGetHealth       = vi.mocked(getHealth);
const mockGetAgentSummary = vi.mocked(getAgentSummary);
const mockListLayer       = vi.mocked(listLayer);

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const MOCK_HEALTH: ModelHealth = {
  status: 'ok', service: 'data-model', version: '2.5',
  store: 'cosmos', cache: 'hit', uptime_seconds: 123,
};

const MOCK_SUMMARY: ModelSummary = {
  total: 3937,
  layers: { endpoints: 60, screens: 17, containers: 8, services: 5,
            agents: 3, projects: 46, wbs: 100, literals: 135 },
};

const MOCK_ENDPOINTS: ModelObject[] = [
  { obj_id: 'ep1', id: 'GET /v1/chat',  layer: 'endpoints', status: 'implemented', service: 'eva-brain-api', row_version: 2 },
  { obj_id: 'ep2', id: 'POST /v1/chat', layer: 'endpoints', status: 'stub',        service: 'eva-brain-api', row_version: 3 },
  { obj_id: 'ep3', id: 'GET /v1/tags',  layer: 'endpoints', status: 'implemented', service: 'eva-brain-api', row_version: 1, title: 'List Tags' },
];

// ---------------------------------------------------------------------------
// Test wrapper
// ---------------------------------------------------------------------------

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter initialEntries={['/model']}>
      <AuthProvider>
        <LangProvider>{children}</LangProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

function renderPage() {
  return render(<ModelBrowserPage />, { wrapper: Wrapper });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ModelBrowserPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetHealth.mockResolvedValue(MOCK_HEALTH);
    mockGetAgentSummary.mockResolvedValue(MOCK_SUMMARY);
    mockListLayer.mockResolvedValue(MOCK_ENDPOINTS);
  });

  it('renders the main landmark without crashing', async () => {
    renderPage();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('shows the data model API health status in the health bar', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Data Model API')).toBeInTheDocument();
      expect(screen.getByText('ok')).toBeInTheDocument();
    });
  });

  it('renders the layer sidebar with navigation role and "Layers" heading', async () => {
    renderPage();
    expect(screen.getByRole('navigation', { name: 'Model layers' })).toBeInTheDocument();
    expect(screen.getByText('Layers')).toBeInTheDocument();
  });

  it('displays object count badges from agent-summary in the sidebar', async () => {
    renderPage();
    await waitFor(() => {
      // endpoints count badge from MOCK_SUMMARY.layers.endpoints = 60
      const badges = screen.getAllByText('60');
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  it('loads endpoint objects and shows them in the grid on mount', async () => {
    renderPage();
    await waitFor(() => {
      expect(mockListLayer).toHaveBeenCalledWith('endpoints');
      const chatItems = screen.getAllByText('GET /v1/chat');
      expect(chatItems.length).toBeGreaterThan(0);
    });
  });

  it('filters objects by search input', async () => {
    renderPage();
    await waitFor(() => {
      const items = screen.getAllByText('GET /v1/chat');
      expect(items.length).toBeGreaterThan(0);
    });

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'tags' } });

    await waitFor(() => {
      expect(screen.queryByText('GET /v1/chat')).not.toBeInTheDocument();
      const tagItems = screen.getAllByText('GET /v1/tags');
      expect(tagItems.length).toBeGreaterThan(0);
    });
  });

  it('opens detail drawer when a row ID button is clicked', async () => {
    renderPage();
    await waitFor(() => {
      const items = screen.getAllByText('GET /v1/chat');
      expect(items.length).toBeGreaterThan(0);
    });

    // Click the inspect button (aria-label contains "Inspect")
    const inspectBtn = screen.getByRole('button', { name: /Inspect GET \/v1\/chat/i });
    fireEvent.click(inspectBtn);

    await waitFor(() => {
      const all = screen.getAllByText('GET /v1/chat');
      expect(all.length).toBeGreaterThan(1); // grid + drawer title
    });
  });

  it('shows "no objects found" when search matches nothing', async () => {
    renderPage();
    await waitFor(() => {
      const items = screen.getAllByText('GET /v1/chat');
      expect(items.length).toBeGreaterThan(0);
    });

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'zzz-no-match' } });

    await waitFor(() => {
      expect(screen.getByText(/No objects found/)).toBeInTheDocument();
    });
  });

  it('shows health bar total object count from agent-summary', async () => {
    renderPage();
    await waitFor(() => {
      const counts = screen.getAllByText(/3,937|3937/);
      expect(counts.length).toBeGreaterThan(0);
    });
  });

  it('has zero accessibility violations (jest-axe)', async () => {
    const { container } = renderPage();
    // Wait for async content to settle
    await waitFor(() => expect(screen.getByText('Data Model API')).toBeInTheDocument());
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
