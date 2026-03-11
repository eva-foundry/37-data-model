/**
 * EvaDialog Component
 * Wraps Fluent UI Dialog with GC Design System styling
 */

import React from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  type DialogProps,
} from '@fluentui/react-components';
import { EvaButton, type EvaButtonProps } from './EvaButton';

export interface EvaDialogProps extends Omit<DialogProps, 'children'> {
  /** Dialog title */
  title?: string;
  /** Dialog content */
  children: React.ReactNode;
  /** Trigger element (button, link, etc.) */
  trigger?: React.ReactNode;
  /** Primary action button props */
  primaryAction?: EvaButtonProps & { label: string };
  /** Secondary action button props */
  secondaryAction?: EvaButtonProps & { label: string };
  /** Cancel button label (default: "Cancel") */
  cancelLabel?: string;
  /** Hide cancel button */
  hideCancelButton?: boolean;
}

/**
 * EvaDialog - GC-compliant modal dialog component
 * 
 * @example
 * ```tsx
 * <EvaDialog
 *   title="Delete Confirmation"  
 *   trigger={<EvaButton>Delete</EvaButton>}
 *   primaryAction={{ label: "Delete", onClick: handleDelete, variant: "primary" }}
 *   cancelLabel="Cancel"
 * >
 *   Are you sure you want to delete this item?
 * </EvaDialog>
 * ```
 */
export function EvaDialog({
  title,
  children,
  trigger,
  primaryAction,
  secondaryAction,
  cancelLabel = 'Cancel',
  hideCancelButton = false,
  ...dialogProps
}: EvaDialogProps) {
  const surface = (
    <DialogSurface>
      <DialogBody>
        {title && <DialogTitle>{title}</DialogTitle>}
        <DialogContent>{children}</DialogContent>
        <DialogActions>
          {!hideCancelButton && (
            <DialogTrigger disableButtonEnhancement>
              <EvaButton variant="secondary">{cancelLabel}</EvaButton>
            </DialogTrigger>
          )}
          {secondaryAction && (
            <EvaButton variant="secondary" {...secondaryAction}>
              {secondaryAction.label}
            </EvaButton>
          )}
          {primaryAction && (
            <EvaButton variant="primary" {...primaryAction}>
              {primaryAction.label}
            </EvaButton>
          )}
        </DialogActions>
      </DialogBody>
    </DialogSurface>
  );

  if (trigger) {
    return (
      <Dialog {...dialogProps}>
        <DialogTrigger disableButtonEnhancement>{trigger as React.ReactElement}</DialogTrigger>
        {surface}
      </Dialog>
    );
  }

  return (
    <Dialog {...dialogProps}>
      {surface}
    </Dialog>
  );
}
