export default function StatsCard({ label, value, unit = '' }: { label: string; value: string | number; unit?: string }) {
  return (
    <div style={{ background: '#1a1a2e', borderRadius: 12, padding: '20px 24px', minWidth: 160 }}>
      <p style={{ color: '#888', margin: 0, fontSize: 13 }}>{label}</p>
      <p style={{ color: '#fff', margin: '8px 0 0', fontSize: 28, fontWeight: 700 }}>
        {value}<span style={{ fontSize: 14, color: '#888', marginLeft: 4 }}>{unit}</span>
      </p>
    </div>
  );
}
