// EVA-FEATURE: F31-UI
// EVA-STORY: F31-UI-002
/**
 * Admin CRUD: Audit Logs Screen
 * YAML mapping: screen_id: audit.logs
 */

import React from 'react';
import { EvaBadge, EvaButton, EvaDataGrid, EvaDrawer, EvaJsonViewer, EvaSelect, EvaInput } from '@eva/ui';
import type { EvaColumn } from '@eva/ui';
import { AsyncStateRenderer } from '../../by-pattern/feedback/loading-states.pattern';
import { PaginationControls } from '../../by-pattern/navigation/pagination.pattern';
import { useAuditEvents, type AuditEvent } from './useAuditEvents';

export const AuditLogsScreen = () => {
  const { events, loading, refresh } = useAuditEvents();
  const [page, setPage] = React.useState(1);
  const pageSize = 5;
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [entityType, setEntityType] = React.useState('all');
  const [outcome, setOutcome] = React.useState('all');
  const [actor, setActor] = React.useState('');

  const filtered = React.useMemo(() => {
    return events.filter((event) => {
      const byEntityType = entityType === 'all' || event.entityType === entityType;
      const byOutcome = outcome === 'all' || event.outcome === outcome;
      const byActor = actor.trim().length === 0 || event.actor.toLowerCase().includes(actor.toLowerCase());
      return byEntityType && byOutcome && byActor;
    });
  }, [events, entityType, outcome, actor]);

  const paged = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const selected = filtered.find((event) => event.id === selectedId) ?? null;

  const columns: EvaColumn<AuditEvent>[] = [
    { columnId: 'timestamp', label: 'Timestamp', renderCell: (row) => row.timestamp },
    { columnId: 'actor', label: 'Actor', renderCell: (row) => row.actor },
    { columnId: 'entityType', label: 'Entity', renderCell: (row) => row.entityType },
    { columnId: 'action', label: 'Action', renderCell: (row) => row.action },
    {
      columnId: 'outcome',
      label: 'Outcome',
      renderCell: (row) => (
        <EvaBadge variant={row.outcome === 'success' ? 'success' : 'error'}>
          {row.outcome}
        </EvaBadge>
      ),
    },
    {
      columnId: 'details',
      label: 'Details',
      renderCell: (row) => (
        <EvaButton variant="subtle" onClick={() => setSelectedId(row.id)}>
          Open
        </EvaButton>
      ),
    },
  ];

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h1>Audit Logs</h1>

      <div style={{ display: 'flex', gap: 12, alignItems: 'end', flexWrap: 'wrap' }}>
        <EvaInput label="Actor contains" value={actor} onChange={(_, d) => setActor(d.value)} />
        <EvaSelect
          label="Entity type"
          value={entityType}
          options={[
            { value: 'all', label: 'all' },
            { value: 'translation', label: 'translation' },
            { value: 'setting', label: 'setting' },
            { value: 'rbac', label: 'rbac' },
            { value: 'feature-flag', label: 'feature-flag' },
          ]}
          onOptionSelect={(_, data) => {
            if (typeof data.optionValue === 'string') {
              setEntityType(data.optionValue);
              setPage(1);
            }
          }}
        />
        <EvaSelect
          label="Outcome"
          value={outcome}
          options={[
            { value: 'all', label: 'all' },
            { value: 'success', label: 'success' },
            { value: 'failure', label: 'failure' },
          ]}
          onOptionSelect={(_, data) => {
            if (typeof data.optionValue === 'string') {
              setOutcome(data.optionValue);
              setPage(1);
            }
          }}
        />
        <EvaButton variant="secondary" onClick={() => { setActor(''); setEntityType('all'); setOutcome('all'); setPage(1); }}>
          Reset
        </EvaButton>
      </div>

      <AsyncStateRenderer loading={loading} isEmpty={filtered.length === 0} emptyMessage="No audit events found.">
        <EvaDataGrid items={paged} columns={columns} getRowId={(row) => row.id} />
      </AsyncStateRenderer>

      <PaginationControls page={page} pageSize={pageSize} totalItems={filtered.length} onPageChange={setPage} />

      <EvaButton variant="secondary" onClick={() => void refresh()}>
        Refresh
      </EvaButton>

      {selected && (
        <EvaDrawer
          open
          position="end"
          size="large"
          title={`Audit event: ${selected.id}`}
          onClose={() => setSelectedId(null)}
        >
          <div style={{ display: 'grid', gap: 10 }}>
            <p><strong>Correlation ID:</strong> {selected.correlationId}</p>
            <p><strong>Action:</strong> {selected.action}</p>
            <p><strong>Actor:</strong> {selected.actor}</p>
            <EvaJsonViewer data={selected.payload} />
          </div>
        </EvaDrawer>
      )}
    </div>
  );
};
