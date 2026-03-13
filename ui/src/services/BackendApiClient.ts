/**
 * BackendApiClient - Stub implementation for 37-data-model
 * 
 * Provides mock responses for admin pages.
 * TODO: Replace with real Data Model API calls
 */

export class BackendApiClient {
  async get(endpoint: string) {
    return { data: [], total: 0, page: 1, pageSize: 20 };
  }

  async post(endpoint: string, data: any) {
    return { success: true, data };
  }

  async put(endpoint: string, data: any) {
    return { success: true, data };
  }

  async delete(endpoint: string) {
    return { success: true };
  }

  // Specific endpoints
  async getSearchHealth() {
    return { indices: [], status: 'unknown' };
  }

  async getIngestionRuns() {
    return { runs: [] };
  }

  async getAuditLogs() {
    return { logs: [] };
  }

  async getSupportTickets() {
    return { tickets: [] };
  }

  async getApps() {
    return { apps: [] };
  }

  async getRbac() {
    return { roles: [], users: [] };
  }

  async getSettings() {
    return { settings: {} };
  }

  async getTranslations() {
    return { translations: [] };
  }
}

// Singleton
export const backendApiClient = new BackendApiClient();

// Named export for MockBackendService compatibility
export const MockBackendService = {
  getTranslations: async () => ({ translations: [] }),
  getSearchHealth: async () => ({ indices: [], status: 'unknown' }),
  getIngestionRuns: async () => ({ runs: [] }),
  getAuditLogs: async () => ({ logs: [] }),
  getSupportTickets: async () => ({ tickets: [] }),
  getApps: async () => ({ apps: [] }),
  getRbacData: async () => ({ roles: [], users: [] }),
  getSettings: async () => ({ settings: {} }),
};

// Default export
export default backendApiClient;
