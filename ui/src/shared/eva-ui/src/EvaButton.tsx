/**
 * EvaButton Component
 * Wraps Fluent UI Button with GC Design System styling
 */

import React from 'react';
import { Button, type ButtonProps } from '@fluentui/react-components';

export interface EvaButtonProps extends Omit<ButtonProps, 'appearance'> {
  /** Button variant following GC Design System */
  variant?: 'primary' | 'secondary' | 'outline' | 'subtle' | 'transparent';
  /** Full width button */
  fullWidth?: boolean;
}

/**
 * EvaButton - GC-compliant button component
 * 
 * @example
 * ```tsx
 * <EvaButton variant="primary" onClick={handleClick}>
 *   Save Changes
 * </EvaButton>
 * ```
 */
export const EvaButton = React.forwardRef<HTMLAnchorElement | HTMLButtonElement, EvaButtonProps>(
  ({ variant = 'primary', fullWidth = false, style, ...props }, ref) => {
    // Map GC variants to Fluent appearance
    const appearance = variant === 'primary' ? 'primary' : 
                      variant === 'secondary' ? 'secondary' :
                      variant === 'outline' ? 'outline' :
                      variant === 'subtle' ? 'subtle' :
                      'transparent';

    return (
      <Button
        ref={ref}
        appearance={appearance}
        style={{
          ...(fullWidth && { width: '100%' }),
          ...style,
        }}
        {...(props as ButtonProps)}
      />
    );
  }
);

EvaButton.displayName = 'EvaButton';
