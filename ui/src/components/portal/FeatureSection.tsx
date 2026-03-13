// ─── FeatureSection — portal-face ────────────────────────────────────────────
// Renders one ADO Feature with its WI cards.

import React from 'react';
import type { Feature, WorkItem } from '@/types/scrum';
import { WICard } from './WICard';

interface FeatureSectionProps {
  feature: Feature;
  onWIClick: (item: WorkItem) => void;
}

export const FeatureSection: React.FC<FeatureSectionProps> = ({ feature, onWIClick }) => (
  <section style={{ marginBottom: 28 }}>
    <h3
      style={{
        fontSize: '0.9rem', fontWeight: 700,
        color: '#0b0c0e', marginBottom: 12,
        display: 'flex', alignItems: 'center', gap: 8,
      }}
    >
      <span style={{ color: '#1d70b8' }}>#</span>
      {feature.title}
      <span style={{ fontWeight: 400, fontSize: '0.75rem', color: '#505a5f' }}>
        ({feature.project})
      </span>
    </h3>
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 10,
      }}
    >
      {feature.work_items.map((wi) => (
        <WICard key={wi.ado_id} item={wi} onClick={onWIClick} />
      ))}
    </div>
  </section>
);

export default FeatureSection;
