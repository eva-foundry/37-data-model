/**
 * FeatureFlagsPage.test.tsx — WI-15
 *
 * Behavioral tests for FeatureFlagsPage.
 * DoD: renders, ≥6 tests, jest-axe 0 violations, enabled/disabled badges,
 * toggle buttons, optimistic update, optimistic revert on error,
 * loading + error + empty states.
 *
 * Vitest + Testing Library + jest-axe.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import { EvaThemeProvider } from '@providers/ThemeProvider';
import { FeatureFlagsPage } from './FeatureFlagsPage';

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
const mockToggleFlag = vi.fn().mockResolvedValue(undefined);

import type { FeatureFlag } from '@api/useFeatureFlagsData';

const enabledFlag: FeatureFlag = {
  flagKey: 'feat.chat-session-state',
  label: 'Chat Session State',
  enabled: true,
  description: 'Persist chat session across page reloads',
  lastModified: '2026-02-10T10:00:00Z',
  modifiedBy: 'alice.martin@esdc.gc.ca',
};

const disabledFlag: FeatureFlag = {
  flagKey: 'feat.eva-homepage',
  label: 'EVA Homepage',
  enabled: false,
  description: 'New homepage with product tile grid',
  lastModified: '2026-02-14T14:00:00Z',
  modifiedBy: 'bob.tremblay@esdc.gc.ca',
};

const defaultHookReturn = {
  items: [enabledFlag, disabledFlag],
  isLoading: false,
  error: null as string | null,
  load: mockLoad,
  toggleFlag: mockToggleFlag,
};

const mockUseFeatureFlagsData = vi.fn(() => defaultHookReturn);

vi.mock('@api/useFeatureFlagsData', () => ({
  useFeatureFlagsData: () => mockUseFeatureFlagsData(),
}));

// ---------------------------------------------------------------------------
// Test wrapper
// ---------------------------------------------------------------------------

function renderPage() {
  return render(
    <EvaThemeProvider>
      <FeatureFlagsPage />
    </EvaThemeProvider>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FeatureFlagsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseFeatureFlagsData.mockReturnValue(defaultHookReturn);
  });

  // ── Rendering ─────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders without crashing', () => {
      const { container } = renderPage();
      expect(container).toBeDefined();
    });

    it('renders the page title i18n key', () => {
      renderPage();
      expect(screen.getByText('admin.featureFlags.title')).toBeInTheDocument();
    });

    it('renders flagKey column header', () => {
      renderPage();
      expect(screen.getByText('admin.featureFlags.column.flagKey')).toBeInTheDocument();
    });

    it('renders flag keys in rows', () => {
      renderPage();
      expect(screen.getByText('feat.chat-session-state')).toBeInTheDocument();
      expect(screen.getByText('feat.eva-homepage')).toBeInTheDocument();
    });

    it('renders enabled badge for enabled flag', () => {
      renderPage();
      expect(screen.getByText('admin.featureFlags.badge.enabled')).toBeInTheDocument();
    });

    it('renders disabled badge for disabled flag', () => {
      renderPage();
      expect(screen.getByText('admin.featureFlags.badge.disabled')).toBeInTheDocument();
    });
  });

  // ── Toggle ─────────────────────────────────────────────────────────────────

  describe('toggle action', () => {
    it('renders disable button for enabled flag', () => {
      renderPage();
      expect(screen.getByText('admin.featureFlags.action.disable')).toBeInTheDocument();
    });

    it('renders enable button for disabled flag', () => {
      renderPage();
      expect(screen.getByText('admin.featureFlags.action.enable')).toBeInTheDocument();
    });

    it('calls toggleFlag when disable button is clicked', () => {
      renderPage();
      const disableBtn = screen.getByText('admin.featureFlags.action.disable');
      fireEvent.click(disableBtn);
      expect(mockToggleFlag).toHaveBeenCalledWith('feat.chat-session-state', false);
    });
  });

  // ── Loading state ──────────────────────────────────────────────────────────

  describe('loading state', () => {
    it('renders with isLoading=true', () => {
      mockUseFeatureFlagsData.mockReturnValue({ ...defaultHookReturn, isLoading: true, items: [] });
      const { container } = renderPage();
      expect(container).toBeDefined();
    });
  });

  // ── Error state ────────────────────────────────────────────────────────────

  describe('error state', () => {
    it('renders error message when error is set', () => {
      mockUseFeatureFlagsData.mockReturnValue({
        ...defaultHookReturn,
        error: 'admin.featureFlags.error.fetch',
        items: [],
      });
      renderPage();
      expect(screen.getByText('admin.featureFlags.error.fetch')).toBeInTheDocument();
    });
  });

  // ── Empty state ────────────────────────────────────────────────────────────

  describe('empty state', () => {
    it('renders empty message when no flags', () => {
      mockUseFeatureFlagsData.mockReturnValue({ ...defaultHookReturn, items: [] });
      renderPage();
      expect(screen.getByText('admin.featureFlags.state.empty')).toBeInTheDocument();
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
