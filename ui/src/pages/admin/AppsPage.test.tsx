/**
 * AppsPage.test.tsx — WI-4
 *
 * Behavioral tests for AppsPage (AdminListPage<App>).
 * DoD checks: renders, jest-axe 0 violations, columns visible,
 * filters rendered, row actions visible, visibility badge visible,
 * disabled badge visible, disable dialog visible on click.
 *
 * Vitest + Testing Library + jest-axe.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import { EvaThemeProvider } from '@providers/ThemeProvider';
import { AppsPage } from './AppsPage';

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
const mockDisableApp = vi.fn().mockResolvedValue(undefined);

const publicApp = {
  appId: 'app-001',
  title: 'Legal Research',
  description: 'AI assistant for legal research',
  visibility: 'public' as const,
  costCenter: 'LEG-001',
  disabled: false,
  updatedAt: '2026-02-01T10:00:00Z',
};

const privateApp = {
  appId: 'app-002',
  title: 'Internal Docs',
  description: 'Internal document search',
  visibility: 'private' as const,
  costCenter: 'IT-002',
  disabled: true,
  updatedAt: '2026-02-10T14:30:00Z',
};

const defaultHookReturn = {
  items: [publicApp, privateApp],
  isLoading: false,
  error: null as string | null,
  filters: [],
  load: mockLoad,
  disableApp: mockDisableApp,
};

// Mutable mock — individual tests can override via mockUseAppsData.mockReturnValue()
const mockUseAppsData = vi.fn(() => defaultHookReturn);

vi.mock('@api/useAppsData', () => ({
  useAppsData: () => mockUseAppsData(),
}));

// ---------------------------------------------------------------------------
// Test wrapper
// ---------------------------------------------------------------------------

function renderPage() {
  return render(
    <EvaThemeProvider>
      <AppsPage />
    </EvaThemeProvider>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AppsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default hook return after any per-test overrides
    mockUseAppsData.mockReturnValue(defaultHookReturn);
  });

  // ── Rendering ─────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders without crashing', () => {
      const { container } = renderPage();
      expect(container).toBeDefined();
    });

    it('renders the page title i18n key', () => {
      renderPage();
      expect(screen.getByText('admin.apps.title')).toBeInTheDocument();
    });

    it('renders title column header', () => {
      renderPage();
      expect(screen.getByText('admin.apps.column.title')).toBeInTheDocument();
    });

    it('renders description column header', () => {
      renderPage();
      expect(screen.getByText('admin.apps.column.description')).toBeInTheDocument();
    });

    it('renders visibility column header', () => {
      renderPage();
      expect(screen.getByText('admin.apps.column.visibility')).toBeInTheDocument();
    });

    it('renders costCenter column header', () => {
      renderPage();
      expect(screen.getByText('admin.apps.column.costCenter')).toBeInTheDocument();
    });

    it('renders disabled column header', () => {
      renderPage();
      expect(screen.getByText('admin.apps.column.disabled')).toBeInTheDocument();
    });

    it('renders updatedAt column header', () => {
      renderPage();
      expect(screen.getByText('admin.apps.column.updatedAt')).toBeInTheDocument();
    });
  });

  // ── Data display ──────────────────────────────────────────────────────────

  describe('data display', () => {
    it('renders app titles in the table', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Legal Research')).toBeInTheDocument();
        expect(screen.getByText('Internal Docs')).toBeInTheDocument();
      });
    });

    it('renders app descriptions in the table', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('AI assistant for legal research')).toBeInTheDocument();
        expect(screen.getByText('Internal document search')).toBeInTheDocument();
      });
    });

    it('renders costCenter values in the table', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('LEG-001')).toBeInTheDocument();
        expect(screen.getByText('IT-002')).toBeInTheDocument();
      });
    });
  });

  // ── Visibility badges ─────────────────────────────────────────────────────

  describe('visibility badge', () => {
    it('renders public badge for public app', async () => {
      renderPage();
      await waitFor(() => {
        expect(
          screen.getAllByText('admin.apps.badge.public').length,
        ).toBeGreaterThanOrEqual(1);
      });
    });

    it('renders private badge for private app', async () => {
      renderPage();
      await waitFor(() => {
        expect(
          screen.getAllByText('admin.apps.badge.private').length,
        ).toBeGreaterThanOrEqual(1);
      });
    });
  });

  // ── Disabled badges ───────────────────────────────────────────────────────

  describe('disabled badge', () => {
    it('renders active badge for non-disabled app', async () => {
      renderPage();
      await waitFor(() => {
        expect(
          screen.getAllByText('admin.apps.badge.active').length,
        ).toBeGreaterThanOrEqual(1);
      });
    });

    it('renders disabled badge for disabled app', async () => {
      renderPage();
      await waitFor(() => {
        expect(
          screen.getAllByText('admin.apps.badge.disabled').length,
        ).toBeGreaterThanOrEqual(1);
      });
    });
  });

  // ── Row actions ───────────────────────────────────────────────────────────

  describe('row actions', () => {
    it('renders an edit button for each row', async () => {
      renderPage();
      await waitFor(() => {
        const editButtons = screen.getAllByText('admin.apps.action.edit');
        // One button per item (2 mock items)
        expect(editButtons).toHaveLength(2);
      });
    });

    it('renders a disable button only for non-disabled rows', async () => {
      renderPage();
      await waitFor(() => {
        // Only publicApp (disabled=false) should have a disable button
        const disableButtons = screen.getAllByText('admin.apps.action.disable');
        expect(disableButtons).toHaveLength(1);
      });
    });
  });

  // ── Error state ───────────────────────────────────────────────────────────

  describe('error state', () => {
    it('renders the error i18n key when error is non-null', () => {
      mockUseAppsData.mockReturnValue({
        ...defaultHookReturn,
        error: 'admin.apps.error.fetch',
        items: [],
      });
      renderPage();
      expect(screen.getByText('admin.apps.error.fetch')).toBeInTheDocument();
    });
  });

  // ── Disable dialog ────────────────────────────────────────────────────────

  describe('disable dialog', () => {
    it('shows confirm dialog when disable button is clicked', async () => {
      renderPage();
      await waitFor(() => {
        const disableButton = screen.getByText('admin.apps.action.disable');
        fireEvent.click(disableButton);
      });
      await waitFor(() => {
        expect(screen.getByText('admin.apps.confirm.disable')).toBeInTheDocument();
      });
    });

    it('closes dialog when cancel is clicked', async () => {
      renderPage();
      await waitFor(() => {
        fireEvent.click(screen.getByText('admin.apps.action.disable'));
      });
      await waitFor(() => {
        const cancelButton = screen.getByText('admin.apps.action.cancel');
        fireEvent.click(cancelButton);
      });
      await waitFor(() => {
        expect(
          screen.queryByText('admin.apps.confirm.disable'),
        ).not.toBeInTheDocument();
      });
    });

    it('calls disableApp with the app id when confirm is clicked', async () => {
      renderPage();
      // Open dialog — only publicApp (disabled=false) has a disable button
      await waitFor(() => {
        fireEvent.click(screen.getByText('admin.apps.action.disable'));
      });
      // Verify dialog opened
      await waitFor(() => {
        expect(screen.getByText('admin.apps.confirm.disable')).toBeInTheDocument();
      });
      // Dialog confirm button is the last element with the same label text
      const confirmButtons = screen.getAllByText('admin.apps.action.disable');
      fireEvent.click(confirmButtons[confirmButtons.length - 1]);
      // disableApp must have been called with the correct appId
      await waitFor(() => {
        expect(mockDisableApp).toHaveBeenCalledWith('app-001');
      });
    });
  });

  // ── Loading state ─────────────────────────────────────────────────────────

  describe('loading state', () => {
    it('renders without crash when isLoading is true', () => {
      vi.doMock('@api/useAppsData', () => ({
        useAppsData: () => ({
          ...defaultHookReturn,
          isLoading: true,
          items: [],
        }),
      }));
      const { container } = renderPage();
      expect(container).toBeDefined();
    });
  });

  // ── Empty state ───────────────────────────────────────────────────────────

  describe('empty state', () => {
    it('renders without crash when items is empty', () => {
      vi.doMock('@api/useAppsData', () => ({
        useAppsData: () => ({ ...defaultHookReturn, items: [] }),
      }));
      const { container } = renderPage();
      expect(container).toBeDefined();
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
