/**
 * EvaSpinner Component
 * Wraps Fluent UI Spinner with GC Design System styling
 */

import { Spinner, type SpinnerProps, makeStyles } from '@fluentui/react-components';
import { gcSpacing } from '@eva/gc-design-system/tokens';

export interface EvaSpinnerProps extends SpinnerProps {
  /** Loading message */
  message?: string;
  /** Center the spinner */
  centered?: boolean;
}

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: gcSpacing[150],
  },
  centeredContainer: {
    justifyContent: 'center',
    minHeight: '200px',
  },
});

/**
 * EvaSpinner - GC-compliant loading spinner component
 * 
 * @example
 * ```tsx
 * <EvaSpinner message="Loading data..." />
 * <EvaSpinner size="large" centered />
 * ```
 */
export function EvaSpinner({
  message,
  centered = false,
  label,
  ...props
}: EvaSpinnerProps) {
  const styles = useStyles();

  return (
    <div className={`${styles.container} ${centered ? styles.centeredContainer : ''}`}>
      <Spinner label={label || message} {...props} />
      {message && !label && <span>{message}</span>}
    </div>
  );
}
