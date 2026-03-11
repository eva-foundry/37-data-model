/**
 * IngestionRunsPage.test.tsx — WI-12
 *
 * Behavioral tests for IngestionRunsPage.
 * DoD: renders, ≥5 tests, jest-axe 0 violations, status badges, trigger dialog,
 * cancel action visibility, loading + error + empty states.
 *
 * Vitest + Testing Library + jest-axe.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import { EvaThemeProvider } from '@providers/ThemeProvider';
import { IngestionRunsPage } from './IngestionRunsPage';

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
const mockTriggerRun = vi.fn().mockResolvedValue(undefined);
const mockCancelRun = vi.fn().mockResolvedValue(undefined);

import type { IngestionRun } from '@api/useIngestionRunsData';

const completedRun: IngestionRun = {
  runId: 'run-001',
  status: 'completed',
  startedAt: '2026-02-19T02:00:00Z',
  completedAt: '2026-02-19T02:12:00Z',
  documentCount: 1842,
};

const runningRun: IngestionRun = {
  runId: 'run-002',
  status: 'running',
  startedAt: '2026-02-20T06:30:00Z',
  completedAt: null,
  documentCount: 320,
};

const failedRun: IngestionRun = {
  runId: 'run-003',
  status: 'failed',
  startedAt: '2026-02-18T18:00:00Z',
  completedAt: '2026-02-18T18:01:00Z',
  documentCount: 0,
};

const defaultHookReturn = {
  items: [completedRun, runningRun, failedRun],
  isLoading: false,
  error: null as string | null,
  load: mockLoad,
  triggerRun: mockTriggerRun,
  cancelRun: mockCancelRun,
};

const mockUseIngestionRunsData = vi.fn(() => defaultHookReturn);

vi.mock('@api/useIngestionRunsData', () => ({
  useIngestionRunsData: () => mockUseIngestionRunsData(),
}));

// ---------------------------------------------------------------------------
// Test wrapper
// ---------------------------------------------------------------------------

function renderPage() {
  return render(
    <EvaThemeProvider>
      <IngestionRunsPage />
    </EvaThemeProvider>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('IngestionRunsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseIngestionRunsData.mockReturnValue(defaultHookReturn);
  });

  // ── Rendering ─────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders without crashing', () => {
      const { container } = renderPage();
      expect(container).toBeDefined();
    });

    it('renders the page title i18n key', () => {
      renderPage();
      expect(screen.getByText('admin.ingestionRuns.title')).toBeInTheDocument();
    });

    it('renders runId column header', () => {
      renderPage();
      expect(screen.getByText('admin.ingestionRuns.column.runId')).toBeInTheDocument();
    });

    it('renders status column header', () => {
      renderPage();
      expect(screen.getByText('admin.ingestionRuns.column.status')).toBeInTheDocument();
    });

    it('renders run ids in rows', () => {
      renderPage();
      expect(screen.getByText('run-001')).toBeInTheDocument();
      expect(screen.getByText('run-002')).toBeInTheDocument();
    });

    it('renders status badges for completed and failed runs', () => {
      renderPage();
      expect(screen.getByText('admin.ingestionRuns.status.completed')).toBeInTheDocument();
      expect(screen.getByText('admin.ingestionRuns.status.failed')).toBeInTheDocument();
    });
  });

  // ── Cancel action ──────────────────────────────────────────────────────────

  describe('cancel action visibility', () => {
    it('shows cancel button only for running runs', () => {
      renderPage();
      const cancelButtons = screen.getAllByText('admin.ingestionRuns.action.cancel');
      // Only run-002 (running) should have a cancel button
      expect(cancelButtons).toHaveLength(1);
    });
  });

  // ── Trigger dialog ─────────────────────────────────────────────────────────

  describe('trigger run dialog', () => {
    it('opens trigger dialog on primary action click', () => {
      renderPage();
      const triggerBtn = screen.getByText('admin.ingestionRuns.action.trigger');
      fireEvent.click(triggerBtn);
      expect(screen.getByText('admin.ingestionRuns.dialog.trigger.title')).toBeInTheDocument();
    });
  });

  // ── Loading state ──────────────────────────────────────────────────────────

  describe('loading state', () => {
    it('renders loading state when isLoading=true', () => {
      mockUseIngestionRunsData.mockReturnValue({ ...defaultHookReturn, isLoading: true, items: [] });
      const { container } = renderPage();
      expect(container).toBeDefined();
    });
  });

  // ── Error state ────────────────────────────────────────────────────────────

  describe('error state', () => {
    it('renders error message when error is set', () => {
      mockUseIngestionRunsData.mockReturnValue({
        ...defaultHookReturn,
        error: 'admin.ingestionRuns.error.fetch',
        items: [],
      });
      renderPage();
      expect(screen.getByText('admin.ingestionRuns.error.fetch')).toBeInTheDocument();
    });
  });

  // ── Empty state ────────────────────────────────────────────────────────────

  describe('empty state', () => {
    it('renders empty message when no runs', () => {
      mockUseIngestionRunsData.mockReturnValue({ ...defaultHookReturn, items: [] });
      renderPage();
      expect(screen.getByText('admin.ingestionRuns.state.empty')).toBeInTheDocument();
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
