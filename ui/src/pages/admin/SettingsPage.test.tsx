/**
 * SettingsPage.test.tsx — WI-3
 *
 * Behavioral tests for SettingsPage (AdminListPage<Setting>).
 * DoD checks: renders, jest-axe 0 violations, columns visible,
 * filter rendered, edit button visible, isPublic badge visible.
 *
 * Vitest + Testing Library + jest-axe.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import { EvaThemeProvider } from '@providers/ThemeProvider';
import { SettingsPage } from './SettingsPage';

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

const publicSetting = {
  key: 'max_tokens',
  category: 'chat',
  value: '4096',
  valueType: 'number',
  isPublic: true,
  description: 'Maximum tokens for chat completion',
};

const internalSetting = {
  key: 'enable_debug',
  category: 'system',
  value: 'false',
  valueType: 'boolean',
  isPublic: false,
  description: 'Enable debug logging',
};

const defaultHookReturn = {
  items: [publicSetting, internalSetting],
  isLoading: false,
  error: null,
  filters: [],
  load: mockLoad,
};

vi.mock('@api/useSettingsData', () => ({
  useSettingsData: () => defaultHookReturn,
}));

// ---------------------------------------------------------------------------
// Test wrapper
// ---------------------------------------------------------------------------

function renderPage() {
  return render(
    <EvaThemeProvider>
      <SettingsPage />
    </EvaThemeProvider>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Rendering ─────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders without crashing', () => {
      const { container } = renderPage();
      expect(container).toBeDefined();
    });

    it('renders the page title i18n key', () => {
      renderPage();
      expect(screen.getByText('admin.settings.title')).toBeInTheDocument();
    });

    it('renders category column header', () => {
      renderPage();
      expect(screen.getByText('admin.settings.column.category')).toBeInTheDocument();
    });

    it('renders key column header', () => {
      renderPage();
      expect(screen.getByText('admin.settings.column.key')).toBeInTheDocument();
    });

    it('renders description column header', () => {
      renderPage();
      expect(screen.getByText('admin.settings.column.description')).toBeInTheDocument();
    });

    it('renders value column header', () => {
      renderPage();
      expect(screen.getByText('admin.settings.column.value')).toBeInTheDocument();
    });

    it('renders valueType column header', () => {
      renderPage();
      expect(screen.getByText('admin.settings.column.valueType')).toBeInTheDocument();
    });

    it('renders isPublic column header', () => {
      renderPage();
      expect(screen.getByText('admin.settings.column.isPublic')).toBeInTheDocument();
    });
  });

  // ── Data display ──────────────────────────────────────────────────────────

  describe('data display', () => {
    it('renders setting keys in the table', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('max_tokens')).toBeInTheDocument();
        expect(screen.getByText('enable_debug')).toBeInTheDocument();
      });
    });

    it('renders setting values in the table', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('4096')).toBeInTheDocument();
        expect(screen.getByText('false')).toBeInTheDocument();
      });
    });

    it('renders category values in the table', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('chat')).toBeInTheDocument();
        expect(screen.getByText('system')).toBeInTheDocument();
      });
    });

    it('renders description values in the table', async () => {
      renderPage();
      await waitFor(() => {
        expect(
          screen.getByText('Maximum tokens for chat completion'),
        ).toBeInTheDocument();
        expect(screen.getByText('Enable debug logging')).toBeInTheDocument();
      });
    });

    it('renders valueType badges in the table', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('number')).toBeInTheDocument();
        expect(screen.getByText('boolean')).toBeInTheDocument();
      });
    });
  });

  // ── isPublic badges ───────────────────────────────────────────────────────

  describe('isPublic badge', () => {
    it('renders public badge for public setting', async () => {
      renderPage();
      await waitFor(() => {
        expect(
          screen.getAllByText('admin.settings.badge.public').length,
        ).toBeGreaterThanOrEqual(1);
      });
    });

    it('renders internal badge for non-public setting', async () => {
      renderPage();
      await waitFor(() => {
        expect(
          screen.getAllByText('admin.settings.badge.internal').length,
        ).toBeGreaterThanOrEqual(1);
      });
    });
  });

  // ── Row actions ───────────────────────────────────────────────────────────

  describe('row actions', () => {
    it('renders an edit button for each row', async () => {
      renderPage();
      await waitFor(() => {
        const editButtons = screen.getAllByText('admin.settings.action.edit');
        // One button per item (2 mock items)
        expect(editButtons).toHaveLength(2);
      });
    });
  });

  // ── Loading state ─────────────────────────────────────────────────────────

  describe('loading state', () => {
    it('renders without crash when isLoading is true', () => {
      vi.doMock('@api/useSettingsData', () => ({
        useSettingsData: () => ({
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
      vi.doMock('@api/useSettingsData', () => ({
        useSettingsData: () => ({ ...defaultHookReturn, items: [] }),
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
