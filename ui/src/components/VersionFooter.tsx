import React from 'react';
import { GC_BORDER, GC_MUTED, GC_SURFACE } from '../styles/tokens';

interface VersionFooterProps {
  buildTimestamp?: string;
}

/**
 * Footer showing version and build info
 * Helps users confirm which build they're running (cache debugging)
 */
export const VersionFooter: React.FC<VersionFooterProps> = ({ buildTimestamp }) => {
  const version = '1.0.0'; // From package.json
  const buildTime = buildTimestamp || new Date().toISOString();
  const buildHash = buildTime.slice(0, 16).replace(/[-:]/g, ''); // Simple hash from timestamp

  return (
    <footer
      style={{
        borderTop: `1px solid ${GC_BORDER}`,
        background: GC_SURFACE,
        padding: '12px 20px',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: GC_MUTED,
      }}
    >
      <div>
        <strong>EVA Data Model UI</strong> v{version} 
        <span style={{ margin: '0 8px' }}>•</span>
        Build: <code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: '3px' }}>{buildHash}</code>
        <span style={{ margin: '0 8px' }}>•</span>
        {new Date(buildTime).toLocaleString('en-CA', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        })}
      </div>
    </footer>
  );
};
