import { T } from '../theme';

export default function PageHeader({ icon, title, subtitle, accent, titleGradient }: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  accent: string;           // rgba border/bg color for the icon tile
  titleGradient: string;    // CSS gradient for the title text
}) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `${accent}1A`, border: `1px solid ${accent}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {icon}
        </div>
        <h1 style={{
          fontSize: 34, fontWeight: 700, letterSpacing: '-0.02em', fontFamily: T.fontD,
          background: titleGradient,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text', lineHeight: 1.1,
        }}>
          {title}
        </h1>
      </div>
      <p style={{ color: T.muted, fontSize: 14, paddingLeft: 48 }}>{subtitle}</p>
    </div>
  );
}
