import { useState } from 'react';
import { T, cardStyle, gradientText } from '../theme';

export default function StatsCard({ label, value, unit = '' }: {
  label: string; value: string | number; unit?: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        ...cardStyle,
        padding: '20px 24px',
        minWidth: 170,
        cursor: 'default',
        transition: 'box-shadow 200ms ease-out',
        boxShadow: hovered ? '0 0 24px rgba(0,212,255,0.12)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <p style={{
        fontSize: 11, fontWeight: 600,
        letterSpacing: 1, textTransform: 'uppercase',
        color: T.muted, margin: 0, marginBottom: 8,
      }}>
        {label}
      </p>
      <p style={{ margin: 0, display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 32, fontWeight: 700, ...gradientText }}>{value}</span>
        {unit && <span style={{ fontSize: 14, color: T.muted }}>{unit}</span>}
      </p>
    </div>
  );
}
