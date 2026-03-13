/**
 * SupportTicketsPage.test.tsx — WI-14
 *
 * Behavioral tests for SupportTicketsPage.
 * DoD: renders, ≥5 tests, jest-axe 0 violations, status + priority badges,
 * filter rendering, loading + error + empty states.
 *
 * Vitest + Testing Library + jest-axe.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { EvaThemeProvider } from '@providers/ThemeProvider';
import { SupportTicketsPage } from './SupportTicketsPage';

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
const mockUpdateTicket = vi.fn().mockResolvedValue(undefined);

import type { SupportTicket } from '@api/useSupportTicketsData';

const ticket1: SupportTicket = {
  ticketId: 'TKT-001',
  title: 'Cannot access chat widget',
  status: 'open',
  priority: 'high',
  createdAt: '2026-02-18T08:00:00Z',
  assignedTo: '',
};

const ticket2: SupportTicket = {
  ticketId: 'TKT-002',
  title: 'Translations page 404',
  status: 'in-progress',
  priority: 'medium',
  createdAt: '2026-02-17T09:30:00Z',
  assignedTo: 'alice.martin@esdc.gc.ca',
};

const ticket3: SupportTicket = {
  ticketId: 'TKT-003',
  title: 'Export CSV fails for 0 items',
  status: 'resolved',
  priority: 'low',
  createdAt: '2026-02-15T11:00:00Z',
  assignedTo: 'bob.tremblay@esdc.gc.ca',
};

const defaultHookReturn = {
  items: [ticket1, ticket2, ticket3],
  isLoading: false,
  error: null as string | null,
  filters: [],
  load: mockLoad,
  updateTicket: mockUpdateTicket,
};

const mockUseSupportTicketsData = vi.fn(() => defaultHookReturn);

vi.mock('@api/useSupportTicketsData', () => ({
  useSupportTicketsData: () => mockUseSupportTicketsData(),
}));

// ---------------------------------------------------------------------------
// Test wrapper
// ---------------------------------------------------------------------------

function renderPage() {
  return render(
    <EvaThemeProvider>
      <SupportTicketsPage />
    </EvaThemeProvider>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SupportTicketsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSupportTicketsData.mockReturnValue(defaultHookReturn);
  });

  // ── Rendering ─────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders without crashing', () => {
      const { container } = renderPage();
      expect(container).toBeDefined();
    });

    it('renders the page title i18n key', () => {
      renderPage();
      expect(screen.getByText('admin.supportTickets.title')).toBeInTheDocument();
    });

    it('renders ticketId column header', () => {
      renderPage();
      expect(screen.getByText('admin.supportTickets.column.ticketId')).toBeInTheDocument();
    });

    it('renders ticket IDs in rows', () => {
      renderPage();
      expect(screen.getByText('TKT-001')).toBeInTheDocument();
      expect(screen.getByText('TKT-002')).toBeInTheDocument();
    });

    it('renders status badges', () => {
      renderPage();
      expect(screen.getByText('admin.supportTickets.status.open')).toBeInTheDocument();
      expect(screen.getByText('admin.supportTickets.status.resolved')).toBeInTheDocument();
    });

    it('renders priority badges', () => {
      renderPage();
      expect(screen.getByText('admin.supportTickets.priority.high')).toBeInTheDocument();
      expect(screen.getByText('admin.supportTickets.priority.low')).toBeInTheDocument();
    });

    it('renders ticket titles', () => {
      renderPage();
      expect(screen.getByText('Cannot access chat widget')).toBeInTheDocument();
    });
  });

  // ── Loading state ──────────────────────────────────────────────────────────

  describe('loading state', () => {
    it('renders with isLoading=true', () => {
      mockUseSupportTicketsData.mockReturnValue({ ...defaultHookReturn, isLoading: true, items: [] });
      const { container } = renderPage();
      expect(container).toBeDefined();
    });
  });

  // ── Error state ────────────────────────────────────────────────────────────

  describe('error state', () => {
    it('renders error message when error is set', () => {
      mockUseSupportTicketsData.mockReturnValue({
        ...defaultHookReturn,
        error: 'admin.supportTickets.error.fetch',
        items: [],
      });
      renderPage();
      expect(screen.getByText('admin.supportTickets.error.fetch')).toBeInTheDocument();
    });
  });

  // ── Empty state ────────────────────────────────────────────────────────────

  describe('empty state', () => {
    it('renders empty message when no tickets', () => {
      mockUseSupportTicketsData.mockReturnValue({ ...defaultHookReturn, items: [] });
      renderPage();
      expect(screen.getByText('admin.supportTickets.state.empty')).toBeInTheDocument();
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
