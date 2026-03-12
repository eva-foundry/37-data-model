/**
 * @eva/templates implementation
 * 
 * Admin pages from 31-eva-faces import AdminListPage from @eva/templates.
 * This provides a working implementation compatible with the admin page interface.
 */

import React from 'react';
import { GC_BLUE, GC_BORDER, GC_TEXT, GC_MUTED, GC_SURFACE, GC_ERROR } from '../styles/tokens';

interface Column<T> {
  columnId: string;
  label: string;
  renderCell: (item: T) => React.ReactNode;
}

interface Filter {
  id: string;
  label: string;
  type: 'text' | 'select' | 'date';
  options?: Array<{ value: string; label: string }>;
}

interface AdminListPageProps<T> {
  title: string;
  description?: string;
  isLoading: boolean;
  error: string | null;
  emptyMessage: string;
  items: T[];
  columns: Column<T>[];
  getRowId: (item: T) => string;
  filters?: Filter[];
  onApplyFilters?: () => void;
  onResetFilters?: () => void;
  onRetry?: () => void;
}

export function AdminListPage<T = any>(props: AdminListPageProps<T>): React.ReactElement {
  const {
    title,
    description,
    isLoading,
    error,
    emptyMessage,
    items,
    columns,
    getRowId,
    onRetry,
  } = props;

  return (
    <div style={{ padding: '20px', minHeight: '100vh', background: GC_SURFACE }}>
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, color: GC_BLUE, fontSize: '1.75rem' }}>{title}</h1>
        {description && (
          <p style={{ margin: '8px 0 0', color: GC_MUTED, fontSize: '0.9rem' }}>{description}</p>
        )}
      </header>

      {error && (
        <div
          style={{
            padding: '16px',
            marginBottom: '20px',
            background: '#fee',
            border: `1px solid ${GC_ERROR}`,
            borderRadius: '6px',
            color: GC_ERROR,
          }}
        >
          <strong>Error:</strong> {error}
          {onRetry && (
            <button
              onClick={onRetry}
              style={{
                marginLeft: '12px',
                padding: '6px 12px',
                background: GC_ERROR,
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          )}
        </div>
      )}

      {isLoading && (
        <div style={{ padding: '40px', textAlign: 'center', color: GC_MUTED }}>
          <p>Loading...</p>
        </div>
      )}

      {!isLoading && !error && items.length === 0 && (
        <div style={{ padding: '40px', textAlign: 'center', color: GC_MUTED }}>
          <p>{emptyMessage}</p>
        </div>
      )}

      {!isLoading && !error && items.length > 0 && (
        <div
          style={{
            border: `1px solid ${GC_BORDER}`,
            borderRadius: '8px',
            background: '#fff',
            overflow: 'auto',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${GC_BORDER}`, background: GC_SURFACE }}>
                {columns.map((col) => (
                  <th
                    key={col.columnId}
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      color: GC_TEXT,
                      fontWeight: 600,
                      fontSize: '0.875rem',
                    }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={getRowId(item)}
                  style={{
                    borderBottom: `1px solid ${GC_BORDER}`,
                  }}
                >
                  {columns.map((col) => (
                    <td
                      key={col.columnId}
                      style={{
                        padding: '12px 16px',
                        color: GC_TEXT,
                        fontSize: '0.875rem',
                      }}
                    >
                      {col.renderCell(item)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminListPage;
