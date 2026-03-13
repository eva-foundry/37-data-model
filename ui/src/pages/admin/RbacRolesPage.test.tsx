/**
 * RbacRolesPage.test.tsx — WI-16
 *
 * Behavioral tests for RbacRolesPage.
 * DoD: renders, ≥6 tests, jest-axe 0 violations, role list, create dialog,
 * delete confirm dialog, delete blocked when userCount > 0,
 * permission badges, loading + error + empty states.
 *
 * Vitest + Testing Library + jest-axe.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import { EvaThemeProvider } from '@providers/ThemeProvider';
import { RbacRolesPage } from './RbacRolesPage';

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
const mockCreateRole = vi.fn().mockResolvedValue(undefined);
const mockUpdateRole = vi.fn().mockResolvedValue(undefined);
const mockDeleteRole = vi.fn().mockResolvedValue(undefined);

import type { Role } from '@api/useRbacRolesData';

const adminRole: Role = {
  roleId: 'role-001',
  name: 'EVA_ADMIN',
  description: 'Full administrative access',
  permissions: ['apps:write', 'rbac:write'],
  userCount: 2,
};

const viewerRole: Role = {
  roleId: 'role-003',
  name: 'EVA_VIEWER',
  description: 'Read-only access',
  permissions: ['apps:read'],
  userCount: 0,
};

const defaultHookReturn = {
  items: [adminRole, viewerRole],
  isLoading: false,
  error: null as string | null,
  load: mockLoad,
  createRole: mockCreateRole,
  updateRole: mockUpdateRole,
  deleteRole: mockDeleteRole,
};

const mockUseRbacRolesData = vi.fn(() => defaultHookReturn);

vi.mock('@api/useRbacRolesData', () => ({
  useRbacRolesData: () => mockUseRbacRolesData(),
}));

// ---------------------------------------------------------------------------
// Test wrapper
// ---------------------------------------------------------------------------

function renderPage() {
  return render(
    <EvaThemeProvider>
      <RbacRolesPage />
    </EvaThemeProvider>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RbacRolesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRbacRolesData.mockReturnValue(defaultHookReturn);
  });

  // ── Rendering ─────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders without crashing', () => {
      const { container } = renderPage();
      expect(container).toBeDefined();
    });

    it('renders the page title i18n key', () => {
      renderPage();
      expect(screen.getByText('admin.rbacRoles.title')).toBeInTheDocument();
    });

    it('renders name column header', () => {
      renderPage();
      expect(screen.getByText('admin.rbacRoles.column.name')).toBeInTheDocument();
    });

    it('renders role names in rows', () => {
      renderPage();
      expect(screen.getByText('EVA_ADMIN')).toBeInTheDocument();
      expect(screen.getByText('EVA_VIEWER')).toBeInTheDocument();
    });

    it('renders permission badges', () => {
      renderPage();
      expect(screen.getByText('apps:write')).toBeInTheDocument();
      expect(screen.getByText('rbac:write')).toBeInTheDocument();
    });
  });

  // ── Create dialog ──────────────────────────────────────────────────────────

  describe('create role dialog', () => {
    it('opens create dialog on primary action click', () => {
      renderPage();
      const createBtn = screen.getByText('admin.rbacRoles.action.create');
      fireEvent.click(createBtn);
      expect(screen.getByText('admin.rbacRoles.dialog.create.title')).toBeInTheDocument();
    });
  });

  // ── Delete guard (userCount > 0) ───────────────────────────────────────────

  describe('delete guard', () => {
    it('shows blocked warning for role with userCount > 0', () => {
      renderPage();
      // adminRole has userCount=2 — click delete should show blocked dialog
      const deleteButtons = screen.getAllByText('admin.rbacRoles.action.delete');
      fireEvent.click(deleteButtons[0]); // adminRole (userCount=2)
      expect(screen.getByText('admin.rbacRoles.dialog.deleteBlocked.title')).toBeInTheDocument();
    });

    it('shows confirm dialog for role with userCount = 0', () => {
      renderPage();
      const deleteButtons = screen.getAllByText('admin.rbacRoles.action.delete');
      fireEvent.click(deleteButtons[1]); // viewerRole (userCount=0)
      expect(screen.getByText('admin.rbacRoles.dialog.delete.title')).toBeInTheDocument();
    });
  });

  // ── Loading state ──────────────────────────────────────────────────────────

  describe('loading state', () => {
    it('renders with isLoading=true', () => {
      mockUseRbacRolesData.mockReturnValue({ ...defaultHookReturn, isLoading: true, items: [] });
      const { container } = renderPage();
      expect(container).toBeDefined();
    });
  });

  // ── Error state ────────────────────────────────────────────────────────────

  describe('error state', () => {
    it('renders error message when error is set', () => {
      mockUseRbacRolesData.mockReturnValue({
        ...defaultHookReturn,
        error: 'admin.rbacRoles.error.fetch',
        items: [],
      });
      renderPage();
      expect(screen.getByText('admin.rbacRoles.error.fetch')).toBeInTheDocument();
    });
  });

  // ── Empty state ────────────────────────────────────────────────────────────

  describe('empty state', () => {
    it('renders empty message when no roles', () => {
      mockUseRbacRolesData.mockReturnValue({ ...defaultHookReturn, items: [] });
      renderPage();
      expect(screen.getByText('admin.rbacRoles.state.empty')).toBeInTheDocument();
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
