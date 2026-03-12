/**
 * Stub for @eva/templates module
 * 
 * Admin pages from 31-eva-faces import AdminListPage from @eva/templates.
 * This stub provides a minimal implementation to satisfy imports until
 * the full template library is integrated.
 */

import React from 'react';

interface AdminListPageProps<T> {
  endpoint?: string;
  title?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

export function AdminListPage<T = any>(props: AdminListPageProps<T>): React.ReactElement {
  return (
    <div style={{ padding: '20px' }}>
      <h2>{props.title || 'Admin Page'}</h2>
      <p style={{ color: '#666', fontStyle: 'italic' }}>
        Full admin template implementation pending.
        Endpoint: {props.endpoint || 'not specified'}
      </p>
      {props.children}
    </div>
  );
}

// Re-export for potential future expansion
export default AdminListPage;
