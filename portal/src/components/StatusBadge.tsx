import { CheckCircle, XCircle } from 'lucide-react';
import { T } from '../theme';

export default function StatusBadge({ status, size = 11 }: { status: string; size?: number }) {
  const ok = status === 'OK';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: ok ? 'rgba(0,232,135,0.12)' : 'rgba(255,69,99,0.12)',
      border: `1px solid ${ok ? 'rgba(0,232,135,0.25)' : 'rgba(255,69,99,0.25)'}`,
      borderRadius: 100, padding: '3px 10px',
      color: ok ? T.green : T.red, fontSize: 12, width: 'fit-content',
    }}>
      {ok ? <CheckCircle size={size} /> : <XCircle size={size} />}
      {status}
    </span>
  );
}
