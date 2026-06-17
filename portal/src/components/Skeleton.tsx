import { T, cardStyle, skeletonStyle } from '../theme';

function Bone({ width = '100%', height = 16, radius = 6 }: {
  width?: string | number; height?: number; radius?: number;
}) {
  return <div style={{ ...skeletonStyle, width, height, borderRadius: radius }} />;
}

export function DashboardSkeleton() {
  return (
    <div>
      {/* Page header skeleton */}
      <div style={{ marginBottom: 32 }}>
        <Bone width={200} height={36} radius={8} />
        <div style={{ marginTop: 8 }}><Bone width={160} height={14} /></div>
      </div>

      {/* KPI cards skeleton */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ ...cardStyle, flex: 1, padding: '22px 24px' }}>
            <Bone width={100} height={11} radius={4} />
            <div style={{ marginTop: 14 }}><Bone width={120} height={40} radius={6} /></div>
            <div style={{ marginTop: 10 }}><Bone width={90} height={12} radius={4} /></div>
          </div>
        ))}
      </div>

      {/* Chart row skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20, marginBottom: 20 }}>
        <div style={{ ...cardStyle, padding: 24 }}>
          <Bone width={180} height={12} radius={4} />
          <div style={{ marginTop: 20 }}><Bone width="100%" height={200} radius={8} /></div>
        </div>
        <div style={{ ...cardStyle, padding: 24 }}>
          <Bone width={120} height={12} radius={4} />
          <div style={{ marginTop: 20 }}><Bone width="100%" height={200} radius={100} /></div>
        </div>
      </div>

      {/* Table skeleton */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: `1px solid ${T.border}` }}>
          <Bone width="100%" height={11} radius={4} />
        </div>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ padding: '16px 20px', borderBottom: i < 4 ? `1px solid rgba(46,61,84,0.4)` : 'none' }}>
            <Bone width="100%" height={20} radius={6} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TracesSkeleton() {
  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <Bone width={140} height={36} radius={8} />
      </div>
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: `1px solid ${T.border}` }}>
          <Bone width="100%" height={11} radius={4} />
        </div>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{ padding: '16px 20px', borderBottom: i < 5 ? `1px solid rgba(46,61,84,0.4)` : 'none' }}>
            <Bone width="100%" height={22} radius={6} />
          </div>
        ))}
      </div>
    </div>
  );
}
