// EVA-FEATURE: F31-UI
// EVA-STORY: F31-UI-009
/**
 * Admin CRUD: Feature Flags Screen
 * YAML mapping: screen_id: features.flags
 */

import React from 'react';
import { EvaBadge, EvaButton, EvaDataGrid, EvaDialog, EvaInput, EvaSelect } from '@eva/ui';
import type { EvaColumn } from '@eva/ui';
import { AsyncStateRenderer } from '../../by-pattern/feedback/loading-states.pattern';
import { SearchFilterBar } from '../../by-pattern/forms/search-filter.pattern';
import { useFeatureFlags, type FeatureFlag } from './useFeatureFlags';

export const FeatureFlagsScreen = () => {
  const { flags, loading, refresh, toggleFlag, setRollout } = useFeatureFlags();
  const [search, setSearch] = React.useState('');
  const [category, setCategory] = React.useState('all');

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [draftRollout, setDraftRollout] = React.useState('0');

  const selected = flags.find((item) => item.id === selectedId) ?? null;

  React.useEffect(() => {
    if (selected) {
      setDraftRollout(String(selected.rollout));
    }
  }, [selected]);

  const filtered = React.useMemo(() => {
    return flags.filter((flag) => {
      const bySearch =
        search.trim().length === 0 ||
        flag.key.toLowerCase().includes(search.toLowerCase()) ||
        flag.description.toLowerCase().includes(search.toLowerCase());
      const byCategory = category === 'all' || flag.category === category;
      return bySearch && byCategory;
    });
  }, [flags, search, category]);

  const columns: EvaColumn<FeatureFlag>[] = [
    { columnId: 'key', label: 'Flag key', renderCell: (row) => row.key },
    { columnId: 'category', label: 'Category', renderCell: (row) => row.category },
    {
      columnId: 'enabled',
      label: 'Status',
      renderCell: (row) => (
        <EvaBadge variant={row.enabled ? 'success' : 'warning'}>
          {row.enabled ? 'Enabled' : 'Disabled'}
        </EvaBadge>
      ),
    },
    { columnId: 'rollout', label: 'Rollout %', renderCell: (row) => `${row.rollout}%` },
    { columnId: 'updatedAt', label: 'Updated', renderCell: (row) => row.updatedAt },
    {
      columnId: 'actions',
      label: 'Actions',
      renderCell: (row) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <EvaButton variant="subtle" onClick={() => toggleFlag(row.id)}>
            {row.enabled ? 'Disable' : 'Enable'}
          </EvaButton>
          <EvaButton variant="outline" onClick={() => setSelectedId(row.id)}>
            Rollout
          </EvaButton>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h1>Feature Flags</h1>

      <SearchFilterBar
        searchLabel="Search flag"
        searchPlaceholder="Flag key or description"
        categoryLabel="Category"
        categoryOptions={[
          { value: 'all', label: 'All' },
          { value: 'admin', label: 'Admin' },
          { value: 'search', label: 'Search' },
          { value: 'finops', label: 'FinOps' },
        ]}
        value={{ search, category }}
        onChange={(value) => {
          setSearch(value.search);
          setCategory(value.category);
        }}
      />

      <AsyncStateRenderer loading={loading} isEmpty={filtered.length === 0} emptyMessage="No feature flags found.">
        <EvaDataGrid items={filtered} columns={columns} getRowId={(row) => row.id} />
      </AsyncStateRenderer>

      <EvaButton variant="secondary" onClick={() => void refresh()}>
        Refresh
      </EvaButton>

      {selected && (
        <EvaDialog
          open
          modalType="modal"
          title={`Adjust rollout: ${selected.key}`}
          primaryAction={{
            label: 'Save',
            onClick: () => {
              setRollout(selected.id, Number(draftRollout));
              setSelectedId(null);
            },
          }}
          secondaryAction={{ label: 'Cancel', onClick: () => setSelectedId(null) }}
          hideCancelButton
        >
          <div style={{ display: 'grid', gap: 12 }}>
            <EvaSelect
              label="Preset rollout"
              value={draftRollout}
              options={[
                { value: '0', label: '0%' },
                { value: '25', label: '25%' },
                { value: '50', label: '50%' },
                { value: '75', label: '75%' },
                { value: '100', label: '100%' },
              ]}
              onOptionSelect={(_, data) => {
                if (typeof data.optionValue === 'string') {
                  setDraftRollout(data.optionValue);
                }
              }}
            />
            <EvaInput
              label="Custom rollout (0-100)"
              value={draftRollout}
              onChange={(_, data) => setDraftRollout(data.value)}
            />
          </div>
        </EvaDialog>
      )}
    </div>
  );
};
