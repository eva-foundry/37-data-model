// Stub types file for portal pages
// TODO: Replace with real types from Data Model API

export interface Workspace {
  id: string;
  name: string;
  type: 'prototype' | 'production' | 'sandbox' | 'development';
  status: 'active' | 'inactive' | 'archived';
  created_at: string;
  updated_at: string;
}
