// EVA-FEATURE: F31-UI
// EVA-STORY: F31-UI-008
/**
 * Admin CRUD: Support Tickets Screen
 * YAML mapping: screen_id: support.tickets
 */

import React from 'react';
import { EvaBadge, EvaButton, EvaDataGrid, EvaDrawer, EvaSelect } from '@eva/ui';
import type { EvaColumn } from '@eva/ui';
import { AsyncStateRenderer } from '../../by-pattern/feedback/loading-states.pattern';
import { PaginationControls } from '../../by-pattern/navigation/pagination.pattern';
import { useSupportTickets, type SupportTicket } from './useSupportTickets';

export const SupportTicketsScreen = () => {
  const { tickets, loading, refresh, setStatus } = useSupportTickets();
  const [page, setPage] = React.useState(1);
  const pageSize = 5;
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const selected = tickets.find((ticket) => ticket.id === selectedId) ?? null;

  const paged = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return tickets.slice(start, start + pageSize);
  }, [tickets, page]);

  const columns: EvaColumn<SupportTicket>[] = [
    { columnId: 'id', label: 'Ticket', renderCell: (row) => row.id },
    { columnId: 'title', label: 'Title', renderCell: (row) => row.title },
    { columnId: 'requester', label: 'Requester', renderCell: (row) => row.requester },
    {
      columnId: 'priority',
      label: 'Priority',
      renderCell: (row) => (
        <EvaBadge variant={row.priority === 'high' ? 'error' : row.priority === 'medium' ? 'warning' : 'info'}>
          {row.priority}
        </EvaBadge>
      ),
    },
    {
      columnId: 'status',
      label: 'Status',
      renderCell: (row) => (
        <EvaBadge
          variant={
            row.status === 'resolved' ? 'success' : row.status === 'in-progress' ? 'warning' : 'info'
          }
        >
          {row.status}
        </EvaBadge>
      ),
    },
    {
      columnId: 'actions',
      label: 'Actions',
      renderCell: (row) => (
        <EvaButton variant="subtle" onClick={() => setSelectedId(row.id)}>
          Open
        </EvaButton>
      ),
    },
  ];

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h1>Support Tickets</h1>

      <AsyncStateRenderer loading={loading} isEmpty={tickets.length === 0} emptyMessage="No support tickets found.">
        <EvaDataGrid items={paged} columns={columns} getRowId={(row) => row.id} />
      </AsyncStateRenderer>

      <PaginationControls page={page} pageSize={pageSize} totalItems={tickets.length} onPageChange={setPage} />

      <EvaButton variant="secondary" onClick={() => void refresh()}>
        Refresh
      </EvaButton>

      {selected && (
        <EvaDrawer
          open
          position="end"
          size="medium"
          title={`Ticket details: ${selected.id}`}
          onClose={() => setSelectedId(null)}
        >
          <div style={{ display: 'grid', gap: 12 }}>
            <p><strong>Title:</strong> {selected.title}</p>
            <p><strong>Requester:</strong> {selected.requester}</p>
            <p><strong>Created:</strong> {selected.createdAt}</p>
            <p><strong>Assignee:</strong> {selected.assignee ?? 'Unassigned'}</p>

            <EvaSelect
              label="Status"
              value={selected.status}
              options={[
                { value: 'open', label: 'open' },
                { value: 'in-progress', label: 'in-progress' },
                { value: 'resolved', label: 'resolved' },
              ]}
              onOptionSelect={(_, data) => {
                if (typeof data.optionValue === 'string') {
                  setStatus(selected.id, data.optionValue as SupportTicket['status']);
                }
              }}
            />
          </div>
        </EvaDrawer>
      )}
    </div>
  );
};
