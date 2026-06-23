import { useState } from 'react';
import { T, cardStyle } from '../theme';

export default function StatsCard({ label, value, unit = '', valueColor, trend, icon }: {
  label: string;
  value: string | number;
  unit?: string;
  valueColor?: string;
  trend?: string;
  icon?: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);

  const color = valueColor ?? T.cyan;

  return (
    <div
      style={{
        ...cardStyle,
        flex: 1,
        minWidth: 160,
        padding: '22px 24px',
        cursor: 'default',
        transition: 'box-shadow 200ms ease-out, border-color 200ms ease-out',
        boxShadow: hovered ? `0 0 32px ${color}22` : '0 1px 8px rgba(0,0,0,0.3)',
        borderColor: hovered ? `${color}44` : T.border,
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 2,
        background: `linear-gradient(90deg, ${color}, transparent)`,
        opacity: hovered ? 1 : 0.5,
        transition: 'opacity 200ms ease-out',
        borderRadius: '18px 18px 0 0',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <p style={{
          fontSize: 11, fontWeight: 600,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: T.muted, margin: 0,
          fontFamily: T.fontM,
        }}>
          {label}
        </p>
        {icon && (
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: `${color}18`,
            border: `1px solid ${color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color,
          }}>
            {icon}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{
          fontSize: 42, fontWeight: 700,
          fontFamily: "'Satoshi', 'Inter', system-ui, sans-serif",
          letterSpacing: '-0.02em',
          color,
          lineHeight: 1,
        }}>
          {value}
        </span>
        {unit && (
          <span style={{ fontSize: 16, color: T.muted, fontWeight: 500 }}>{unit}</span>
        )}
      </div>

      {trend && (
        <p style={{ margin: 0, marginTop: 10, fontSize: 12, color: T.muted, lineHeight: 1.4 }}>
          {trend}
        </p>
      )}
    </div>
  );
}
