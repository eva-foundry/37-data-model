/**
 * ModelReportPage.test.tsx -- WI-MODEL-2 unit tests (2026-02-25)
 *
 * Acceptance: >= 5 tests, tsc exit 0, jest-axe 0 violations,
 * all strings via useLang t object, link to ModelBrowserPage present.
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
import { ModelReportPage } from './ModelReportPage';
import type {
  ModelHealth, ModelSummary, ModelObject, GraphResponse, EdgeTypeMeta,
} from '@api/modelApi';

// ---------------------------------------------------------------------------
// Module mock -- hoisted before import resolution
// ---------------------------------------------------------------------------

vi.mock('@api/modelApi', () => ({
  getHealth:             vi.fn(),
  getAgentSummary:       vi.fn(),
  listLayer:             vi.fn(),
  getGraph:              vi.fn(),
  getEdgeTypes:          vi.fn(),
  endpointStatusMatrix:  vi.fn(),
}));

import {
  getHealth, getAgentSummary, listLayer,
  getGraph, getEdgeTypes, endpointStatusMatrix,
} from '@api/modelApi';
const mockGetHealth            = vi.mocked(getHealth);
const mockGetAgentSummary      = vi.mocked(getAgentSummary);
const mockListLayer            = vi.mocked(listLayer);
const mockGetGraph             = vi.mocked(getGraph);
const mockGetEdgeTypes         = vi.mocked(getEdgeTypes);
const mockEndpointStatusMatrix = vi.mocked(endpointStatusMatrix);

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const MOCK_HEALTH: ModelHealth = {
  status: 'ok', service: 'data-model', version: '2.5',
  store: 'cosmos', cache: 'hit', uptime_seconds: 456,
};

const MOCK_SUMMARY: ModelSummary = {
  total: 3937,
  layers: {
    endpoints: 60, screens: 17, containers: 8, services: 5,
    agents: 3, projects: 46, wbs: 100,
  },
};

const MOCK_ENDPOINTS: ModelObject[] = [
  { obj_id: 'ep1', id: 'GET /v1/chat',  layer: 'endpoints', status: 'implemented', service: 'eva-brain-api' },
  { obj_id: 'ep2', id: 'POST /v1/chat', layer: 'endpoints', status: 'stub',        service: 'eva-brain-api' },
];

const MOCK_GRAPH: GraphResponse = {
  nodes: [], edges: [], node_count: 142, edge_count: 307, duration_ms: 48,
};

const MOCK_EDGE_TYPES: EdgeTypeMeta[] = [
  { edge_type: 'uses_container', count: 85 },
  { edge_type: 'calls_endpoint', count: 42 },
];

const MOCK_MATRIX = [
  { service: 'eva-brain-api', implemented: 1, stub: 1, planned: 0, coded: 0, total: 2 },
];

// ---------------------------------------------------------------------------
// Test wrapper
// ---------------------------------------------------------------------------

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter initialEntries={['/model/report']}>
      <AuthProvider>
        <LangProvider>{children}</LangProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

function renderPage() {
  return render(<ModelReportPage />, { wrapper: Wrapper });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ModelReportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetHealth.mockResolvedValue(MOCK_HEALTH);
    mockGetAgentSummary.mockResolvedValue(MOCK_SUMMARY);
    mockListLayer.mockResolvedValue(MOCK_ENDPOINTS);
    mockGetGraph.mockResolvedValue(MOCK_GRAPH);
    mockGetEdgeTypes.mockResolvedValue(MOCK_EDGE_TYPES);
    mockEndpointStatusMatrix.mockReturnValue(MOCK_MATRIX);
  });

  it('renders the main landmark without crashing', async () => {
    renderPage();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('shows the "Data Model API" health bar after load', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Data Model API')).toBeInTheDocument();
      expect(screen.getByText('ok')).toBeInTheDocument();
    });
  });

  it('shows the page H1 title "Data Model Report"', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Data Model Report');
    });
  });

  it('renders all 4 tab buttons with correct labels', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('Overview').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Layer Counts').length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText(/Endpoint Matrix/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Edge Types/).length).toBeGreaterThan(0);
  });

  it('displays graph node/edge counts in Overview tab', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('142')).toBeInTheDocument(); // node_count
      expect(screen.getByText('307')).toBeInTheDocument(); // edge_count
    });
  });

  it('shows total object count from agent-summary in Overview', async () => {
    renderPage();
    await waitFor(() => {
      const counts = screen.getAllByText(/3,937|3937/);
      expect(counts.length).toBeGreaterThan(0);
    });
  });

  it('shows endpoint matrix rows when Endpoint Matrix tab is clicked', async () => {
    renderPage();
    await waitFor(() => expect(screen.getAllByText(/Endpoint Matrix/).length).toBeGreaterThan(0));

    // Click the role=tab button whose label starts with "Endpoint Matrix"
    const tabs = screen.getAllByRole('tab');
    const epTab = tabs.find(tab => tab.textContent?.includes('Endpoint Matrix'));
    expect(epTab).toBeDefined();
    fireEvent.click(epTab!);

    await waitFor(() => {
      const rows = screen.getAllByText('eva-brain-api');
      expect(rows.length).toBeGreaterThan(0);
    });
  });

  it('includes a link back to /model (Layer Browser)', async () => {
    renderPage();
    await waitFor(() => {
      const link = screen.getByRole('link', { name: /Layer Browser/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/model');
    });
  });

  it('has zero accessibility violations (jest-axe)', async () => {
    const { container } = renderPage();
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
