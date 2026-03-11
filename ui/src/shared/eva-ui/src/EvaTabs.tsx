/**
 * EvaTabs Component
 * Wraps Fluent UI TabList with GC Design System styling
 */

import React from 'react';
import {
  TabList,
  Tab,
  type TabListProps,
  type SelectTabEventHandler,
} from '@fluentui/react-components';

export interface EvaTab {
  value: string;
  label: string;
  icon?: React.ReactElement;
  disabled?: boolean;
}

export interface EvaTabsProps extends Omit<TabListProps, 'children' | 'onTabSelect'> {
  /** Array of tab configurations */
  tabs: EvaTab[];
  /** Currently selected tab value */
  selectedValue?: string;
  /** Callback when tab is selected */
  onTabSelect?: (value: string) => void;
}

/**
 * EvaTabs - GC-compliant tabs component
 * 
 * @example
 * ```tsx
 * <EvaTabs
 *   tabs={[
 *     { value: 'overview', label: 'Overview' },
 *     { value: 'details', label: 'Details' },
 *     { value: 'history', label: 'History' },
 *   ]}
 *   selectedValue={selectedTab}
 *   onTabSelect={setSelectedTab}
 * />
 * ```
 */
export function EvaTabs({
  tabs,
  selectedValue,
  onTabSelect,
  ...props
}: EvaTabsProps) {
  const handleSelect: SelectTabEventHandler = (_event, data) => {
    if (onTabSelect && typeof data.value === 'string') {
      onTabSelect(data.value);
    }
  };

  return (
    <TabList
      selectedValue={selectedValue}
      onTabSelect={handleSelect}
      {...props}
    >
      {tabs.map((tab) => (
        <Tab
          key={tab.value}
          value={tab.value}
          icon={tab.icon}
          disabled={tab.disabled}
        >
          {tab.label}
        </Tab>
      ))}
    </TabList>
  );
}
