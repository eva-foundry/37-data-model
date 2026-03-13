/**
 * EvaSelect Component
 * Wraps Fluent UI Select (Dropdown/Combobox) with GC Design System styling
 */

import React from 'react';
import {
  Dropdown,
  Option,
  type DropdownProps,
  Label,
  makeStyles,
} from '@fluentui/react-components';
import { gcColors, gcSpacing } from '@eva/gc-design-system/tokens';

export interface EvaSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface EvaSelectProps extends Omit<DropdownProps, 'children'> {
  /** Label text */
  label?: string;
  /** Helper text shown below the select */
  helperText?: string;
  /** Error message */
  errorMessage?: string;
  /** Required field indicator */
  required?: boolean;
  /** Options to display */
  options: EvaSelectOption[];
}

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: gcSpacing[100],
  },
  helperText: {
    fontSize: '0.875rem',
    color: gcColors.text.secondary,
    marginTop: gcSpacing[50],
  },
  errorText: {
    fontSize: '0.875rem',
    color: gcColors.status.error.DEFAULT,
    marginTop: gcSpacing[50],
  },
});

/**
 * EvaSelect - GC-compliant select/dropdown component
 * 
 * @example
 * ```tsx
 * <EvaSelect
 *   label="Province"
 *   required
 *   options={[
 *     { value: 'on', label: 'Ontario' },
 *     { value: 'qc', label: 'Quebec' },
 *   ]}
 * />
 * ```
 */
export const EvaSelect = React.forwardRef<HTMLButtonElement, EvaSelectProps>(
  ({ label, helperText, errorMessage, required, options, id, ...props }, ref) => {
    const styles = useStyles();
    const selectId = id || React.useId();

    return (
      <div className={styles.container}>
        {label && (
          <Label htmlFor={selectId} required={required}>
            {label}
          </Label>
        )}
        <Dropdown
          ref={ref}
          id={selectId}
          {...props}
        >
          {options.map((option) => (
            <Option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </Option>
          ))}
        </Dropdown>
        {errorMessage && (
          <span className={styles.errorText} role="alert">
            {errorMessage}
          </span>
        )}
        {!errorMessage && helperText && (
          <span className={styles.helperText}>{helperText}</span>
        )}
      </div>
    );
  }
);

EvaSelect.displayName = 'EvaSelect';
