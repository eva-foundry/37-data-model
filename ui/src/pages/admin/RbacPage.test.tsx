/**
 * RbacPage.test.tsx — WI-9
 *
 * Behavioral tests for RbacPage (AdminListPage<UserRole>).
 * DoD checks: renders, jest-axe 0 violations, columns visible,
 * filters rendered, role badge visible, enabled badge visible,
 * row actions visible, loading + error + empty states.
 *
 * Vitest + Testing Library + jest-axe.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { EvaThemeProvider } from '@providers/ThemeProvider';
import { RbacPage } from './RbacPage';

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

const adminUser: import('@api/useRbacData').UserRole = {
  id: 'rbac-001',
  displayName: 'Alice Martin',
  email: 'alice.martin@esdc.gc.ca',
  role: 'EVA_ADMIN',
  scope: 'global',
  enabled: true,
  updatedAt: '2026-01-15T09:00:00Z',
};

const inactiveEditor: import('@api/useRbacData').UserRole = {
  id: 'rbac-002',
  displayName: 'Bob Tremblay',
  email: 'bob.tremblay@esdc.gc.ca',
  role: 'EVA_EDITOR',
  scope: 'jurisprudence',
  enabled: false,
  updatedAt: '2026-01-20T14:30:00Z',
};

const viewerUser: import('@api/useRbacData').UserRole = {
  id: 'rbac-003',
  displayName: 'Carol Nguyen',
  email: 'carol.nguyen@esdc.gc.ca',
  role: 'EVA_VIEWER',
  scope: 'jurisprudence',
  enabled: true,
  updatedAt: '2026-01-25T11:15:00Z',
};

const defaultHookReturn = {
  items: [adminUser, inactiveEditor, viewerUser],
  isLoading: false,
  error: null as string | null,
  filters: [],
  load: mockLoad,
};

const mockUseRbacData = vi.fn(() => defaultHookReturn);

vi.mock('@api/useRbacData', () => ({
  useRbacData: () => mockUseRbacData(),
}));

// ---------------------------------------------------------------------------
// Test wrapper
// ---------------------------------------------------------------------------

function renderPage() {
  return render(
    <EvaThemeProvider>
      <RbacPage />
    </EvaThemeProvider>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RbacPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRbacData.mockReturnValue(defaultHookReturn);
  });

  // ── Rendering ─────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders without crashing', () => {
      const { container } = renderPage();
      expect(container).toBeDefined();
    });

    it('renders the page title i18n key', () => {
      renderPage();
      expect(screen.getByText('admin.rbac.title')).toBeInTheDocument();
    });

    it('renders displayName column header', () => {
      renderPage();
      expect(screen.getByText('admin.rbac.column.displayName')).toBeInTheDocument();
    });

    it('renders email column header', () => {
      renderPage();
      expect(screen.getByText('admin.rbac.column.email')).toBeInTheDocument();
    });

    it('renders role column header', () => {
      renderPage();
      expect(screen.getByText('admin.rbac.column.role')).toBeInTheDocument();
    });

    it('renders scope column header', () => {
      renderPage();
      expect(screen.getByText('admin.rbac.column.scope')).toBeInTheDocument();
    });

    it('renders enabled column header', () => {
      renderPage();
      expect(screen.getByText('admin.rbac.column.enabled')).toBeInTheDocument();
    });
  });

  // ── Data rows ─────────────────────────────────────────────────────────────

  describe('data rows', () => {
    it('renders displayName for each assignment', () => {
      renderPage();
      expect(screen.getByText('Alice Martin')).toBeInTheDocument();
      expect(screen.getByText('Bob Tremblay')).toBeInTheDocument();
      expect(screen.getByText('Carol Nguyen')).toBeInTheDocument();
    });

    it('renders email for each assignment', () => {
      renderPage();
      expect(screen.getByText('alice.martin@esdc.gc.ca')).toBeInTheDocument();
      expect(screen.getByText('bob.tremblay@esdc.gc.ca')).toBeInTheDocument();
    });

    it('renders scope for each assignment', () => {
      renderPage();
      expect(screen.getByText('global')).toBeInTheDocument();
      const jurCells = screen.getAllByText('jurisprudence');
      expect(jurCells.length).toBeGreaterThanOrEqual(1);
    });

    it('renders role badge for EVA_ADMIN', () => {
      renderPage();
      const badges = screen.getAllByText('admin.rbac.badge.admin');
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });

    it('renders role badge for EVA_EDITOR', () => {
      renderPage();
      const badges = screen.getAllByText('admin.rbac.badge.editor');
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });

    it('renders role badge for EVA_VIEWER', () => {
      renderPage();
      const badges = screen.getAllByText('admin.rbac.badge.viewer');
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });

    it('renders enabled badge for active user', () => {
      renderPage();
      const enabledBadges = screen.getAllByText('admin.rbac.badge.enabled');
      expect(enabledBadges.length).toBeGreaterThanOrEqual(1);
    });

    it('renders disabled badge for inactive user', () => {
      renderPage();
      const disabledBadges = screen.getAllByText('admin.rbac.badge.disabled');
      expect(disabledBadges.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Row actions ───────────────────────────────────────────────────────────

  describe('row actions', () => {
    it('renders an Edit row action for each assignment', () => {
      renderPage();
      const editButtons = screen.getAllByText('admin.rbac.action.edit');
      expect(editButtons.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Primary action ────────────────────────────────────────────────────────

  describe('primary action', () => {
    it('renders the Assign Role primary action button', () => {
      renderPage();
      expect(screen.getByText('admin.rbac.action.assign')).toBeInTheDocument();
    });
  });

  // ── State: loading ────────────────────────────────────────────────────────

  describe('state: loading', () => {
    it('passes isLoading=true to AdminListPage without crashing', () => {
      mockUseRbacData.mockReturnValue({ ...defaultHookReturn, isLoading: true, items: [] });
      const { container } = renderPage();
      expect(container).toBeDefined();
    });
  });

  // ── State: error ──────────────────────────────────────────────────────────

  describe('state: error', () => {
    it('translates the error key when error is non-null', () => {
      mockUseRbacData.mockReturnValue({
        ...defaultHookReturn,
        items: [],
        error: 'admin.rbac.error.fetch',
      });
      renderPage();
      expect(screen.getByText('admin.rbac.error.fetch')).toBeInTheDocument();
    });
  });

  // ── State: empty ──────────────────────────────────────────────────────────

  describe('state: empty', () => {
    it('renders empty message i18n key when items=[]', () => {
      mockUseRbacData.mockReturnValue({ ...defaultHookReturn, items: [] });
      renderPage();
      expect(screen.getByText('admin.rbac.state.empty')).toBeInTheDocument();
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
