/**
 * TelemetryService - Stub implementation for 37-data-model
 * 
 * Provides no-op telemetry for development.
 * TODO: Connect to real Application Insights or observability service
 */

export class TelemetryService {
  track(event: string, properties?: Record<string, unknown>): void {
    console.debug('[Telemetry]', event, properties);
  }

  trackEvent(name: string, properties?: Record<string, any>) {
    console.debug('[Telemetry]', name, properties);
  }

  trackPageView(name?: string) {
    console.debug('[Telemetry] Page view:', name);
  }

  trackException(error: Error, properties?: Record<string, unknown>) {
    console.error('[Telemetry] Exception:', error, properties);
  }

  trackTrace(message: string, severityLevel?: number) {
    console.debug('[Telemetry] Trace:', message);
  }
}

// Singleton instance  
export const telemetryService = new TelemetryService();
export const telemetry = telemetryService; // Alias for compatibility

// Default export for compatibility
const telemetryClient = new TelemetryService();
export default telemetryClient;
