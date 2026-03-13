/**
 * BackendService
 *
 * Barrel re-export that satisfies the `adminBackendService` import in BackendApiClient.
 * Points to the mock service instance; swap to a real implementation when a backend is available.
 */

export { mockBackendService as adminBackendService } from './MockBackendService';
