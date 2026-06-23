import type React from 'react';

export const T = {
  bg:      'var(--color-bg)',
  surface: 'var(--color-surface)',
  card:    'var(--color-card)',
  card2:   'var(--color-card2)',
  border:  'var(--color-border)',
  text:    'var(--color-text)',
  muted:   'var(--color-muted)',
  cyan:    'var(--color-cyan)',
  purple:  'var(--color-purple)',
  green:   'var(--color-green)',
  amber:   'var(--color-amber)',
  red:     'var(--color-red)',
  grad:    'linear-gradient(135deg, var(--color-cyan) 0%, var(--color-purple) 100%)',
  fontD:   "'Clash Display', sans-serif",
  fontM:   "'JetBrains Mono', monospace",
} as const;

export const cardStyle: React.CSSProperties = {
  background:   'var(--color-card)',
  border:       '1px solid var(--color-border)',
  borderRadius: 18,
};

export const gradientText: React.CSSProperties = {
  background:           'linear-gradient(135deg, var(--color-cyan) 0%, var(--color-purple) 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor:  'transparent',
  backgroundClip:       'text',
};

export const skeletonStyle: React.CSSProperties = {
  background:     'linear-gradient(90deg, var(--color-skeleton-from) 0px, var(--color-skeleton-mid) 200px, var(--color-skeleton-from) 400px)',
  backgroundSize: '800px 100%',
  animation:      'shimmer 1.6s ease-in-out infinite',
  borderRadius:   10,
};

export const transition = 'all 200ms ease-out';
