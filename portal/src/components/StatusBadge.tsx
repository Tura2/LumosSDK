import { CheckCircle, XCircle } from 'lucide-react';
import { T } from '../theme';

export default function StatusBadge({ status, size = 11 }: { status: string; size?: number }) {
  const ok = status === 'OK';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: ok ? 'rgba(var(--color-green-rgb),0.12)' : 'rgba(var(--color-red-rgb),0.12)',
      border: `1px solid ${ok ? 'rgba(var(--color-green-rgb),0.25)' : 'rgba(var(--color-red-rgb),0.25)'}`,
      borderRadius: 100, padding: '3px 10px',
      color: ok ? T.green : T.red, fontSize: 12, width: 'fit-content',
    }}>
      {ok ? <CheckCircle size={size} /> : <XCircle size={size} />}
      {status}
    </span>
  );
}
