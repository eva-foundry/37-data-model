/**
 * EvaDrawer Component  
 * Wraps Fluent UI Drawer with GC Design System styling
 */

import React from 'react';
import {
  Drawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
  type DrawerProps,
  Button,
} from '@fluentui/react-components';
import { Dismiss24Regular } from '@fluentui/react-icons';

export type EvaDrawerProps = DrawerProps & {
  /** Drawer title */
  title?: string;
  /** Drawer content */
  children: React.ReactNode;
  /** Close button callback */
  onClose?: () => void;
};

/**
 * EvaDrawer - GC-compliant side drawer/panel component
 * 
 * @example
 * ```tsx
 * <EvaDrawer
 *   title="Settings"
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   position="end"
 * >
 *   <div>Drawer content here</div>
 * </EvaDrawer>
 * ```
 */
export function EvaDrawer({
  title,
  children,
  onClose,
  ...props
}: EvaDrawerProps) {
  return (
    <Drawer {...props}>
      {title && (
        <DrawerHeader>
          <DrawerHeaderTitle
            action={
              onClose && (
                <Button
                  appearance="subtle"
                  aria-label="Close"
                  icon={<Dismiss24Regular />}
                  onClick={onClose}
                />
              )
            }
          >
            {title}
          </DrawerHeaderTitle>
        </DrawerHeader>
      )}
      <DrawerBody>{children}</DrawerBody>
    </Drawer>
  );
}
