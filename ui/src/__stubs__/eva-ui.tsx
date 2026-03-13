/**
 * eva-ui.tsx -- test/dev stub for @eva/ui workspace package.
 *
 * The dist/ folder is not built in this workspace's dev/test environment.
 * These stubs render semantic HTML so test assertions (aria queries, text
 * content, fireEvent) work as if the real components were present.
 *
 * Vite resolves `@eva/ui` -> this file via the alias in vite.config.ts.
 * EVA-STORY: F31-WI20-test-stubs
 */
import React from 'react';
import type { FC, ReactNode, ButtonHTMLAttributes, SelectHTMLAttributes } from 'react';

// ---------------------------------------------------------------------------
// EvaButton
// ---------------------------------------------------------------------------
interface EvaButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  appearance?: string;
  variant?: string;
  size?: string;
  icon?: ReactNode;
  iconPosition?: 'before' | 'after';
}
export const EvaButton: FC<EvaButtonProps> = ({
  children,
  appearance: _a,
  variant: _v,
  size: _s,
  icon: _i,
  iconPosition: _ip,
  ...rest
}) => <button {...rest}>{children}</button>;

// ---------------------------------------------------------------------------
// EvaBadge
// ---------------------------------------------------------------------------
interface EvaBadgeProps {
  children?: ReactNode;
  appearance?: string;
  color?: string;
  size?: string;
  shape?: string;
  'aria-label'?: string;
  className?: string;
}
export const EvaBadge: FC<EvaBadgeProps> = ({ children, 'aria-label': ariaLabel, ...rest }) => (
  <span role="status" aria-label={ariaLabel} {...rest}>
    {children}
  </span>
);

// ---------------------------------------------------------------------------
// EvaDialog
// ---------------------------------------------------------------------------
interface EvaDialogPrimaryAction {
  label: string;
  onClick: () => void;
  variant?: string;
  disabled?: boolean;
  icon?: ReactNode;
}
interface EvaDialogProps {
  open?: boolean;
  title?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  /** Legacy close callback */
  onDismiss?: () => void;
  /** Fluent-style open-state change callback */
  onOpenChange?: (_ev: unknown, data: { open: boolean }) => void;
  /** Primary confirm/submit action */
  primaryAction?: EvaDialogPrimaryAction;
  /** Cancel button label */
  cancelLabel?: string;
  'aria-label'?: string;
}
export const EvaDialog: FC<EvaDialogProps> = ({
  open,
  title,
  children,
  footer,
  onDismiss,
  onOpenChange,
  primaryAction,
  cancelLabel,
  'aria-label': ariaLabel,
}) => {
  if (!open) return null;
  const handleClose = () => {
    onOpenChange?.(undefined, { open: false });
    onDismiss?.();
  };
  return (
    <div role="dialog" aria-modal="true" aria-label={ariaLabel as string | undefined}>
      {title && <div>{title}</div>}
      <div>{children}</div>
      {footer && <div>{footer}</div>}
      {cancelLabel && (
        <button type="button" onClick={handleClose}>
          {cancelLabel}
        </button>
      )}
      {primaryAction && (
        <button
          type="button"
          disabled={primaryAction.disabled}
          onClick={primaryAction.onClick}
        >
          {primaryAction.label}
        </button>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// EvaDrawer
// ---------------------------------------------------------------------------
interface EvaDrawerProps {
  open?: boolean;
  title?: ReactNode;
  children?: ReactNode;
  onDismiss?: () => void;
  position?: 'start' | 'end';
  size?: string;
}
export const EvaDrawer: FC<EvaDrawerProps> = ({ open, children }) => {
  if (!open) return null;
  return <div role="complementary">{children}</div>;
};

// ---------------------------------------------------------------------------
// EvaSpinner
// ---------------------------------------------------------------------------
interface EvaSpinnerProps {
  label?: string;
  size?: string;
  appearance?: string;
}
export const EvaSpinner: FC<EvaSpinnerProps> = ({ label }) => (
  <div role="status" aria-label={label}>
    {label}
  </div>
);

// ---------------------------------------------------------------------------
// EvaSelect
// ---------------------------------------------------------------------------
interface EvaSelectOption {
  value: string;
  label: string;
}
interface EvaSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  options?: EvaSelectOption[];
  onChange?: (value: string) => void;
  placeholder?: string;
}
export const EvaSelect: FC<EvaSelectProps> = ({
  label,
  options = [],
  onChange,
  placeholder,
  id,
  ...rest
}) => (
  <div>
    {label && <label htmlFor={id}>{label}</label>}
    <select
      id={id}
      onChange={(e) => onChange?.(e.target.value)}
      {...rest}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </div>
);

// ---------------------------------------------------------------------------
// EvaInput
// ---------------------------------------------------------------------------
interface EvaInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}
export const EvaInput: FC<EvaInputProps> = ({
  label,
  error,
  id,
  ...rest
}) => (
  <div>
    {label && <label htmlFor={id}>{label}</label>}
    <input id={id} {...rest} />
    {error && <span role="alert">{error}</span>}
  </div>
);

// ---------------------------------------------------------------------------
// EvaIcon
// ---------------------------------------------------------------------------
interface EvaIconProps {
  name?: string;
  size?: number | string;
  'aria-hidden'?: boolean | 'true' | 'false';
  className?: string;
}
export const EvaIcon: FC<EvaIconProps> = ({ name }) => (
  <span aria-hidden="true">{name}</span>
);

// ---------------------------------------------------------------------------
// EvaJsonViewer
// ---------------------------------------------------------------------------
interface EvaJsonViewerProps {
  value?: unknown;
  collapsed?: number | boolean;
  style?: React.CSSProperties;
}
export const EvaJsonViewer: FC<EvaJsonViewerProps> = ({ value }) => (
  <pre>{JSON.stringify(value, null, 2)}</pre>
);

// ---------------------------------------------------------------------------
// EvaDateRangePicker
// ---------------------------------------------------------------------------
interface EvaDateRangePickerProps {
  startDate?: string | null;
  endDate?: string | null;
  onChange?: (start: string | null, end: string | null) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}
export const EvaDateRangePicker: FC<EvaDateRangePickerProps> = ({ label }) => (
  <div>
    {label && <span>{label}</span>}
    <input type="date" aria-label="start date" />
    <input type="date" aria-label="end date" />
  </div>
);

// ---------------------------------------------------------------------------
// EvaTabs
// ---------------------------------------------------------------------------
export interface EvaTab {
  id: string;
  label: string;
  content: ReactNode;
}
interface EvaTabsProps {
  tabs?: EvaTab[];
  defaultTab?: string;
  activeTab?: string;
  onTabChange?: (id: string) => void;
  children?: ReactNode;
}
export const EvaTabs: FC<EvaTabsProps> = ({ tabs = [], children }) => (
  <div role="tablist">
    {tabs.map((tab) => (
      <div key={tab.id} role="tab">
        {tab.label}
        <div role="tabpanel">{tab.content}</div>
      </div>
    ))}
    {children}
  </div>
);

// ---------------------------------------------------------------------------
// EvaDataGrid
// ---------------------------------------------------------------------------
interface EvaDataGridColumn {
  key: string;
  label: string;
  minWidth?: number;
  sortable?: boolean;
}
interface EvaDataGridProps {
  columns?: EvaDataGridColumn[];
  rows?: any[];
  onRowClick?: (row: any) => void;
  loading?: boolean;
  emptyMessage?: string;
  keyField?: string;
}
export const EvaDataGrid: FC<EvaDataGridProps> = ({
  columns = [],
  rows = [],
  onRowClick,
  loading,
  emptyMessage = 'No data',
  keyField = 'id',
}) => {
  if (loading) return <div role="status">Loading...</div>;
  if (rows.length === 0) return <div>{emptyMessage}</div>;
  
  return (
    <table role="table">
      <thead>
        <tr role="row">
          {columns.map((col) => (
            <th key={col.key} role="columnheader">
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => (
          <tr
            key={row[keyField] ?? idx}
            role="row"
            onClick={() => onRowClick?.(row)}
            style={{ cursor: onRowClick ? 'pointer' : 'default' }}
          >
            {columns.map((col) => (
              <td key={col.key} role="cell">
                {row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
