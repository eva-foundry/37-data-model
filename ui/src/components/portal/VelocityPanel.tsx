// ─── VelocityPanel — portal-face ─────────────────────────────────────────────
// Inline SVG sparklines for test count and coverage trend across sprints.
// Accessible fallback: summary table (visually hidden; readable by screen reader).

import React from 'react';
import type { VelocityPoint } from '@/types/scrum';
import { useLang } from '@context/LangContext';

interface VelocityPanelProps {
  points: VelocityPoint[];
}

const W = 260;
const H = 60;
const PAD = 6;

function sparklinePath(values: number[], maxVal: number): string {
  if (values.length < 2 || maxVal === 0) return '';
  const step = (W - PAD * 2) / (values.length - 1);
  return values
    .map((v, i) => {
      const x = PAD + i * step;
      const y = PAD + (1 - v / maxVal) * (H - PAD * 2);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

export const VelocityPanel: React.FC<VelocityPanelProps> = ({ points }) => {
  const { lang } = useLang();

  if (points.length === 0) return null;

  const testCounts  = points.map((p) => p.tests_added);
  const coverages   = points.map((p) => p.coverage_pct ?? 0);
  const maxTests    = Math.max(...testCounts, 1);
  const maxCoverage = 100;

  const t = {
    title:    lang === 'en' ? 'Velocity' : 'Vélocité',
    tests:    lang === 'en' ? 'Tests added' : 'Tests ajoutés',
    coverage: lang === 'en' ? 'Coverage %' : 'Couverture %',
    sprint:   lang === 'en' ? 'Sprint' : 'Sprint',
  };

  return (
    <section style={{ marginTop: 24 }}>
      <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: 12, color: '#0b0c0e' }}>
        {t.title}
      </h3>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {/* Tests sparkline */}
        <div>
          <div style={{ fontSize: '0.75rem', color: '#505a5f', marginBottom: 4 }}>{t.tests}</div>
          <svg width={W} height={H} aria-hidden="true" style={{ border: '1px solid #b1b4b6', borderRadius: 4 }}>
            <path d={sparklinePath(testCounts, maxTests)} fill="none" stroke="#1d70b8" strokeWidth="2" />
          </svg>
        </div>

        {/* Coverage sparkline */}
        <div>
          <div style={{ fontSize: '0.75rem', color: '#505a5f', marginBottom: 4 }}>{t.coverage}</div>
          <svg width={W} height={H} aria-hidden="true" style={{ border: '1px solid #b1b4b6', borderRadius: 4 }}>
            <path d={sparklinePath(coverages, maxCoverage)} fill="none" stroke="#00703c" strokeWidth="2" />
          </svg>
        </div>
      </div>

      {/* Accessible table */}
      <table
        style={{
          position: 'absolute', width: 1, height: 1,
          overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap',
        }}
        aria-label={t.title}
      >
        <thead>
          <tr>
            <th>{t.sprint}</th>
            <th>{t.tests}</th>
            <th>{t.coverage}</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.sprint}>
              <td>{p.sprint}</td>
              <td>{p.tests_added}</td>
              <td>{p.coverage_pct !== null ? `${p.coverage_pct}%` : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};

export default VelocityPanel;
