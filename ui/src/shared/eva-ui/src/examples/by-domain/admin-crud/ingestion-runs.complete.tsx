// EVA-FEATURE: F31-UI
// EVA-STORY: F31-UI-006
/**
 * Admin CRUD: Ingestion Runs Screen
 * YAML mapping: screen_id: ingestion.runs
 */

import React from 'react';
import { EvaBadge, EvaButton, EvaDataGrid, EvaDrawer, EvaJsonViewer } from '@eva/ui';
import type { EvaColumn } from '@eva/ui';
import { AsyncStateRenderer } from '../../by-pattern/feedback/loading-states.pattern';
import { PaginationControls } from '../../by-pattern/navigation/pagination.pattern';
import { useIngestionRuns, type IngestionRun } from './useIngestionRuns';

export const IngestionRunsScreen = () => {
  const { runs, loading, refresh, retryRun } = useIngestionRuns();
  const [page, setPage] = React.useState(1);
  const pageSize = 5;
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const selected = runs.find((run) => run.id === selectedId) ?? null;

  const paged = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return runs.slice(start, start + pageSize);
  }, [runs, page]);

  const columns: EvaColumn<IngestionRun>[] = [
    { columnId: 'id', label: 'Run ID', renderCell: (row) => row.id },
    { columnId: 'pipeline', label: 'Pipeline', renderCell: (row) => row.pipeline },
    { columnId: 'startedAt', label: 'Started', renderCell: (row) => row.startedAt },
    { columnId: 'durationSec', label: 'Duration (s)', renderCell: (row) => String(row.durationSec) },
    { columnId: 'recordsIn', label: 'In', renderCell: (row) => String(row.recordsIn) },
    { columnId: 'recordsOut', label: 'Out', renderCell: (row) => String(row.recordsOut) },
    {
      columnId: 'status',
      label: 'Status',
      renderCell: (row) => (
        <EvaBadge
          variant={
            row.status === 'succeeded' ? 'success' : row.status === 'running' ? 'info' : 'error'
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
        <div style={{ display: 'flex', gap: 8 }}>
          <EvaButton variant="subtle" onClick={() => setSelectedId(row.id)}>
            Details
          </EvaButton>
          {row.status === 'failed' && (
            <EvaButton variant="outline" onClick={() => retryRun(row.id)}>
              Retry
            </EvaButton>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h1>Ingestion Runs</h1>

      <AsyncStateRenderer loading={loading} isEmpty={runs.length === 0} emptyMessage="No ingestion runs found.">
        <EvaDataGrid items={paged} columns={columns} getRowId={(row) => row.id} />
      </AsyncStateRenderer>

      <PaginationControls page={page} pageSize={pageSize} totalItems={runs.length} onPageChange={setPage} />

      <EvaButton variant="secondary" onClick={() => void refresh()}>
        Refresh
      </EvaButton>

      {selected && (
        <EvaDrawer
          open
          position="end"
          size="medium"
          title={`Run details: ${selected.id}`}
          onClose={() => setSelectedId(null)}
        >
          <div style={{ display: 'grid', gap: 10 }}>
            <p><strong>Pipeline:</strong> {selected.pipeline}</p>
            <p><strong>Status:</strong> {selected.status}</p>
            <p><strong>Started:</strong> {selected.startedAt}</p>
            <p><strong>Duration (s):</strong> {selected.durationSec}</p>
            {selected.errorMessage && <p><strong>Error:</strong> {selected.errorMessage}</p>}
            <EvaJsonViewer
              data={{
                id: selected.id,
                recordsIn: selected.recordsIn,
                recordsOut: selected.recordsOut,
                status: selected.status,
                errorMessage: selected.errorMessage,
              }}
            />
          </div>
        </EvaDrawer>
      )}
    </div>
  );
};
