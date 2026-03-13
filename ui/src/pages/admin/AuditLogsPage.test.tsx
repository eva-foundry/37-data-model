/**
 * AuditLogsPage.test.tsx — WI-10
 *
 * Behavioral tests for AuditLogsPage (AdminListPage<AuditLog>).
 * DoD checks: renders, jest-axe 0 violations, columns visible,
 * outcome badge visible, loading + error + empty states.
 * Read-only view: no row actions, no primaryAction tested.
 *
 * Vitest + Testing Library + jest-axe.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { EvaThemeProvider } from '@providers/ThemeProvider';
import { AuditLogsPage } from './AuditLogsPage';

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

const successLog: import('@api/useAuditLogsData').AuditLog = {
  id: 'audit-001',
  timestamp: '2026-02-20T05:00:00Z',
  actor: 'alice.martin@esdc.gc.ca',
  entityType: 'App',
  action: 'disable',
  outcome: 'success',
  details: 'Disabled app-003 (FinOps Analyzer)',
};

const failureLog: import('@api/useAuditLogsData').AuditLog = {
  id: 'audit-004',
  timestamp: '2026-02-18T10:10:00Z',
  actor: 'unknown@esdc.gc.ca',
  entityType: 'App',
  action: 'create',
  outcome: 'failure',
  details: 'Attempt to create app rejected — missing costCenter field',
};

const rbacLog: import('@api/useAuditLogsData').AuditLog = {
  id: 'audit-003',
  timestamp: '2026-02-19T14:22:00Z',
  actor: 'carol.nguyen@esdc.gc.ca',
  entityType: 'RBAC',
  action: 'assign',
  outcome: 'success',
  details: 'Assigned EVA_VIEWER to david.osei@esdc.gc.ca',
};

const defaultHookReturn = {
  items: [successLog, failureLog, rbacLog],
  isLoading: false,
  error: null as string | null,
  filters: [],
  load: mockLoad,
};

const mockUseAuditLogsData = vi.fn(() => defaultHookReturn);

vi.mock('@api/useAuditLogsData', () => ({
  useAuditLogsData: () => mockUseAuditLogsData(),
}));

// ---------------------------------------------------------------------------
// Test wrapper
// ---------------------------------------------------------------------------

function renderPage() {
  return render(
    <EvaThemeProvider>
      <AuditLogsPage />
    </EvaThemeProvider>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AuditLogsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuditLogsData.mockReturnValue(defaultHookReturn);
  });

  // ── Rendering ─────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders without crashing', () => {
      const { container } = renderPage();
      expect(container).toBeDefined();
    });

    it('renders the page title i18n key', () => {
      renderPage();
      expect(screen.getByText('admin.auditLogs.title')).toBeInTheDocument();
    });

    it('renders timestamp column header', () => {
      renderPage();
      expect(screen.getByText('admin.auditLogs.column.timestamp')).toBeInTheDocument();
    });

    it('renders actor column header', () => {
      renderPage();
      expect(screen.getByText('admin.auditLogs.column.actor')).toBeInTheDocument();
    });

    it('renders entityType column header', () => {
      renderPage();
      expect(screen.getByText('admin.auditLogs.column.entityType')).toBeInTheDocument();
    });

    it('renders action column header', () => {
      renderPage();
      expect(screen.getByText('admin.auditLogs.column.action')).toBeInTheDocument();
    });

    it('renders outcome column header', () => {
      renderPage();
      expect(screen.getByText('admin.auditLogs.column.outcome')).toBeInTheDocument();
    });
  });

  // ── Data rows ─────────────────────────────────────────────────────────────

  describe('data rows', () => {
    it('renders actor for each log entry', () => {
      renderPage();
      expect(screen.getByText('alice.martin@esdc.gc.ca')).toBeInTheDocument();
      expect(screen.getByText('unknown@esdc.gc.ca')).toBeInTheDocument();
      expect(screen.getByText('carol.nguyen@esdc.gc.ca')).toBeInTheDocument();
    });

    it('renders entityType for each log entry', () => {
      renderPage();
      const appCells = screen.getAllByText('App');
      expect(appCells.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('RBAC')).toBeInTheDocument();
    });

    it('renders action for each log entry', () => {
      renderPage();
      expect(screen.getByText('disable')).toBeInTheDocument();
      expect(screen.getByText('create')).toBeInTheDocument();
      expect(screen.getByText('assign')).toBeInTheDocument();
    });

    it('renders success outcome badge', () => {
      renderPage();
      const successBadges = screen.getAllByText('admin.auditLogs.badge.success');
      expect(successBadges.length).toBeGreaterThanOrEqual(1);
    });

    it('renders failure outcome badge', () => {
      renderPage();
      const failureBadges = screen.getAllByText('admin.auditLogs.badge.failure');
      expect(failureBadges.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── State: loading ────────────────────────────────────────────────────────

  describe('state: loading', () => {
    it('passes isLoading=true without crashing', () => {
      mockUseAuditLogsData.mockReturnValue({ ...defaultHookReturn, isLoading: true, items: [] });
      const { container } = renderPage();
      expect(container).toBeDefined();
    });
  });

  // ── State: error ──────────────────────────────────────────────────────────

  describe('state: error', () => {
    it('translates the error key when error is non-null', () => {
      mockUseAuditLogsData.mockReturnValue({
        ...defaultHookReturn,
        items: [],
        error: 'admin.auditLogs.error.fetch',
      });
      renderPage();
      expect(screen.getByText('admin.auditLogs.error.fetch')).toBeInTheDocument();
    });
  });

  // ── State: empty ──────────────────────────────────────────────────────────

  describe('state: empty', () => {
    it('renders empty message i18n key when items=[]', () => {
      mockUseAuditLogsData.mockReturnValue({ ...defaultHookReturn, items: [] });
      renderPage();
      expect(screen.getByText('admin.auditLogs.state.empty')).toBeInTheDocument();
    });
  });

  // ── Accessibility ─────────────────────────────────────────────────────────

  describe('accessibility', () => {
    it('has no automatically detectable a11y violations', async () => {
      const { container } = renderPage();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
