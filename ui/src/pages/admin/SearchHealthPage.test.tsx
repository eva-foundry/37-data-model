/**
 * SearchHealthPage.test.tsx — WI-13
 *
 * Behavioral tests for SearchHealthPage.
 * DoD: renders, ≥5 tests, jest-axe 0 violations, health colour badges,
 * reindex dialog, loading + error + empty states.
 *
 * Vitest + Testing Library + jest-axe.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import { EvaThemeProvider } from '@providers/ThemeProvider';
import { SearchHealthPage } from './SearchHealthPage';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@hooks/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
    lang: 'en',
    setLang: vi.fn(),
    isLoading: false,
  }),
}));

const mockLoad = vi.fn().mockResolvedValue(undefined);
const mockTriggerReindex = vi.fn().mockResolvedValue(undefined);

import type { SearchIndex } from '@api/useSearchHealthData';

const healthyIndex: SearchIndex = {
  indexName: 'eva-jurisprudence-en',
  status: 'healthy',
  docCount: 18420,
  lastIndexed: '2026-02-19T02:12:00Z',
  healthScore: 97,
};

const degradedIndex: SearchIndex = {
  indexName: 'eva-jurisprudence-fr',
  status: 'degraded',
  docCount: 14210,
  lastIndexed: '2026-02-17T14:00:00Z',
  healthScore: 61,
};

const errorIndex: SearchIndex = {
  indexName: 'eva-policies',
  status: 'error',
  docCount: 0,
  lastIndexed: '2026-01-30T09:00:00Z',
  healthScore: 12,
};

const defaultHookReturn = {
  items: [healthyIndex, degradedIndex, errorIndex],
  isLoading: false,
  error: null as string | null,
  load: mockLoad,
  triggerReindex: mockTriggerReindex,
};

const mockUseSearchHealthData = vi.fn(() => defaultHookReturn);

vi.mock('@api/useSearchHealthData', () => ({
  useSearchHealthData: () => mockUseSearchHealthData(),
}));

// ---------------------------------------------------------------------------
// Test wrapper
// ---------------------------------------------------------------------------

function renderPage() {
  return render(
    <EvaThemeProvider>
      <SearchHealthPage />
    </EvaThemeProvider>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SearchHealthPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSearchHealthData.mockReturnValue(defaultHookReturn);
  });

  // ── Rendering ─────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders without crashing', () => {
      const { container } = renderPage();
      expect(container).toBeDefined();
    });

    it('renders the page title i18n key', () => {
      renderPage();
      expect(screen.getByText('admin.searchHealth.title')).toBeInTheDocument();
    });

    it('renders indexName column header', () => {
      renderPage();
      expect(screen.getByText('admin.searchHealth.column.indexName')).toBeInTheDocument();
    });

    it('renders index names in rows', () => {
      renderPage();
      expect(screen.getByText('eva-jurisprudence-en')).toBeInTheDocument();
      expect(screen.getByText('eva-jurisprudence-fr')).toBeInTheDocument();
    });

    it('renders health status badges', () => {
      renderPage();
      expect(screen.getByText('admin.searchHealth.status.healthy')).toBeInTheDocument();
      expect(screen.getByText('admin.searchHealth.status.error')).toBeInTheDocument();
    });

    it('renders reindex action buttons for each row', () => {
      renderPage();
      const reindexButtons = screen.getAllByText('admin.searchHealth.action.reindex');
      expect(reindexButtons).toHaveLength(3);
    });
  });

  // ── Reindex dialog ─────────────────────────────────────────────────────────

  describe('reindex dialog', () => {
    it('opens reindex dialog when reindex button clicked', () => {
      renderPage();
      const reindexButtons = screen.getAllByText('admin.searchHealth.action.reindex');
      fireEvent.click(reindexButtons[0]);
      expect(screen.getByText('admin.searchHealth.dialog.reindex.title')).toBeInTheDocument();
    });
  });

  // ── Loading state ──────────────────────────────────────────────────────────

  describe('loading state', () => {
    it('renders with isLoading=true', () => {
      mockUseSearchHealthData.mockReturnValue({ ...defaultHookReturn, isLoading: true, items: [] });
      const { container } = renderPage();
      expect(container).toBeDefined();
    });
  });

  // ── Error state ────────────────────────────────────────────────────────────

  describe('error state', () => {
    it('renders error message when error is set', () => {
      mockUseSearchHealthData.mockReturnValue({
        ...defaultHookReturn,
        error: 'admin.searchHealth.error.fetch',
        items: [],
      });
      renderPage();
      expect(screen.getByText('admin.searchHealth.error.fetch')).toBeInTheDocument();
    });
  });

  // ── Empty state ────────────────────────────────────────────────────────────

  describe('empty state', () => {
    it('renders empty message when no indexes', () => {
      mockUseSearchHealthData.mockReturnValue({ ...defaultHookReturn, items: [] });
      renderPage();
      expect(screen.getByText('admin.searchHealth.state.empty')).toBeInTheDocument();
    });
  });

  // ── Accessibility ──────────────────────────────────────────────────────────

  describe('accessibility', () => {
    it('has no axe violations', async () => {
      const { container } = renderPage();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
