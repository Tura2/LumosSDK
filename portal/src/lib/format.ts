export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return isToday ? `Today ${time}` : d.toLocaleDateString();
}

const ANDROID_VERSIONS: Record<number, string> = {
  35: 'Android 15', 34: 'Android 14', 33: 'Android 13', 32: 'Android 12L',
  31: 'Android 12', 30: 'Android 11', 29: 'Android 10', 28: 'Android 9',
};

export function androidOsLabel(api: number | null): string {
  if (api == null) return '—';
  return ANDROID_VERSIONS[api] ?? `API ${api}`;
}

const MODEL_PRICING: Record<string, { in: number; out: number }> = {
  // USD per 1M tokens
  'gpt-4o': { in: 5, out: 15 },
  'gpt-4o-mini': { in: 0.15, out: 0.6 },
  'claude-3-5-sonnet': { in: 3, out: 15 },
};
const DEFAULT_PRICING = { in: 5, out: 15 };

export function estimateCost(model: string | null, tokensIn: number, tokensOut: number): number {
  const p = (model && MODEL_PRICING[model]) || DEFAULT_PRICING;
  return (tokensIn / 1_000_000) * p.in + (tokensOut / 1_000_000) * p.out;
}
