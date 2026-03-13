import React from 'react';
import type { ApiHealthState } from '@hooks/useApiHealth';

interface ApiHealthBannerProps {
  health: ApiHealthState;
  onDismiss?: () => void;
}

const BANNER_COLORS = {
  healthy: {
    bg: '#d4edda',
    border: '#c3e6cb',
    text: '#155724',
  },
  degraded: {
    bg: '#fff3cd',
    border: '#ffeaa7',
    text: '#856404',
  },
  unavailable: {
    bg: '#f8d7da',
    border: '#f5c6cb',
    text: '#721c24',
  },
  checking: {
    bg: '#d1ecf1',
    border: '#bee5eb',
    text: '#0c5460',
  },
};

const BANNER_ICONS = {
  healthy: '✓',
  degraded: '⚠',
  unavailable: '✕',
  checking: '⏳',
};

/**
 * Banner component showing Data Model API health status
 * 
 * Screen Machine Pattern: Include this in all generated pages
 * - Shows when backend is unavailable
 * - Honest UX: tells users the system state
 * - Graceful degradation: UI works but with limitations
 */
export const ApiHealthBanner: React.FC<ApiHealthBannerProps> = ({ health, onDismiss }) => {
  // Don't show banner when healthy
  if (health.status === 'healthy') {
    return null;
  }

  const colors = BANNER_COLORS[health.status];
  const icon = BANNER_ICONS[health.status];

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        background: colors.bg,
        borderBottom: `2px solid ${colors.border}`,
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        color: colors.text,
        fontSize: '0.9rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
        <span
          style={{
            fontWeight: 'bold',
            fontSize: '1.1rem',
            lineHeight: 1,
          }}
        >
          {icon}
        </span>
        <div style={{ flex: 1 }}>
          <strong>{health.status.toUpperCase()}: </strong>
          {health.message}
          {health.status === 'unavailable' && (
            <span style={{ display: 'block', fontSize: '0.85rem', marginTop: '4px', opacity: 0.9 }}>
              The UI is functional, but data may be cached or simulated. Live features require API connectivity.
            </span>
          )}
        </div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss banner"
          style={{
            background: 'transparent',
            border: 'none',
            color: colors.text,
            cursor: 'pointer',
            fontSize: '1.2rem',
            padding: '4px 8px',
            lineHeight: 1,
          }}
        >
          ×
        </button>
      )}
    </div>
  );
};
