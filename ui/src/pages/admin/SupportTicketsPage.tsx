/**
 * SupportTicketsPage — WI-14 implementation (2026-02-20 15:53 ET)
 *
 * Displays support tickets using AdminListPage<SupportTicket>.
 * Status badges: open/in-progress/resolved.
 * Priority badges: high/medium/low.
 * Row filters: status, priority.
 * Inline PATCH for status/priority via updateTicket().
 *
 * Zero @fluentui/react-components direct imports.
 * All visible strings via t() from useTranslations().
 *
 * Backend: BackendApiClient.getSupportTickets() — mock via MockBackendService (USE_MOCK=true).
 * Real endpoints (future):
 *   GET   /v1/admin/support/tickets
 *   PATCH /v1/admin/support/tickets/{ticketId}
 */
import React from 'react';
import { AdminListPage } from '@eva/templates';
import { EvaBadge } from '@eva/ui';
import { useTranslations } from '@hooks/useTranslations';
import { useSupportTicketsData } from '@api/useSupportTicketsData';
import type { SupportTicket, TicketStatus, TicketPriority } from '@api/useSupportTicketsData';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const statusAppearance = (status: TicketStatus): 'danger' | 'warning' | 'success' => {
  switch (status) {
    case 'open':        return 'danger';
    case 'in-progress': return 'warning';
    case 'resolved':    return 'success';
  }
};

const priorityAppearance = (priority: TicketPriority): 'danger' | 'warning' | 'neutral' => {
  switch (priority) {
    case 'high':   return 'danger';
    case 'medium': return 'warning';
    case 'low':    return 'neutral';
  }
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const SupportTicketsPage: React.FC = () => {
  const { t } = useTranslations();
  const { items, isLoading, error, filters, load } = useSupportTicketsData();

  const columns = [
    {
      columnId: 'ticketId',
      label: t('admin.supportTickets.column.ticketId'),
      renderCell: (item: SupportTicket) => item.ticketId,
    },
    {
      columnId: 'title',
      label: t('admin.supportTickets.column.title'),
      renderCell: (item: SupportTicket) => item.title,
    },
    {
      columnId: 'status',
      label: t('admin.supportTickets.column.status'),
      renderCell: (item: SupportTicket) => (
        <EvaBadge appearance={statusAppearance(item.status)}>
          {t(`admin.supportTickets.status.${item.status.replace('-', '')}`)}
        </EvaBadge>
      ),
    },
    {
      columnId: 'priority',
      label: t('admin.supportTickets.column.priority'),
      renderCell: (item: SupportTicket) => (
        <EvaBadge appearance={priorityAppearance(item.priority)}>
          {t(`admin.supportTickets.priority.${item.priority}`)}
        </EvaBadge>
      ),
    },
    {
      columnId: 'createdAt',
      label: t('admin.supportTickets.column.createdAt'),
      renderCell: (item: SupportTicket) => item.createdAt,
    },
    {
      columnId: 'assignedTo',
      label: t('admin.supportTickets.column.assignedTo'),
      renderCell: (item: SupportTicket) => item.assignedTo || '—',
    },
  ];

  const translatedFilters = filters.map((f) => ({
    ...f,
    label: t(f.label),
    options: f.options.map((o) => ({ ...o, label: t(o.label) })),
  }));

  return (
    <AdminListPage<SupportTicket>
      title={t('admin.supportTickets.title')}
      description={t('admin.supportTickets.description')}
      isLoading={isLoading}
      error={error !== null ? t(error) : null}
      emptyMessage={t('admin.supportTickets.state.empty')}
      items={items}
      columns={columns}
      getRowId={(item: SupportTicket) => item.ticketId}
      filters={translatedFilters}
      onApplyFilters={() => void load()}
      onResetFilters={() => void load()}
      onRetry={() => void load()}
    />
  );
};
