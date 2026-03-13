/**
 * EvaBadge Component
 * Wraps Fluent UI Badge with GC Design System styling
 */

import { Badge, type BadgeProps } from '@fluentui/react-components';

export interface EvaBadgeProps extends Omit<BadgeProps, 'color'> {
  /** Badge color variant */
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
}

/**
 * EvaBadge - GC-compliant badge component for status indicators
 * 
 * @example
 * ```tsx
 * <EvaBadge variant="success">Active</EvaBadge>
 * <EvaBadge variant="warning">Pending</EvaBadge>
 * <EvaBadge variant="error">Failed</EvaBadge>
 * ```
 */
export function EvaBadge({ variant = 'neutral', ...props }: EvaBadgeProps) {
  // Map GC variants to Fluent colors
  const color = variant === 'success' ? 'success' :
                variant === 'warning' ? 'warning' :
                variant === 'error' ? 'danger' :
                variant === 'info' ? 'informative' :
                'brand';

  return <Badge color={color} {...props} />;
}
