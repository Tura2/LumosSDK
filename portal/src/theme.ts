import type React from 'react';

export const T = {
  bg:      '#040810',
  surface: '#070D1C',
  card:    '#0B1628',
  card2:   '#0F1E38',
  border:  '#2E3D54',
  text:    '#E8F2FF',
  muted:   '#6A7D9A',
  cyan:    '#00D4FF',
  purple:  '#7B5FFF',
  green:   '#00E887',
  amber:   '#FFB800',
  red:     '#FF4563',
  grad:    'linear-gradient(135deg, #00D4FF 0%, #7B5FFF 100%)',
  grad2:   'linear-gradient(135deg, #7B5FFF 0%, #FF4563 100%)',
  fontD:   "'Clash Display', sans-serif",
  fontM:   "'JetBrains Mono', monospace",
} as const;

export const cardStyle: React.CSSProperties = {
  background:   T.card,
  border:       `1px solid ${T.border}`,
  borderRadius: 18,
};

export const cardGlow: React.CSSProperties = {
  background:   'linear-gradient(135deg, rgba(0,212,255,0.07), rgba(123,95,255,0.04))',
  border:       '1px solid rgba(0,212,255,0.18)',
  borderRadius: 18,
};

export const gradientText: React.CSSProperties = {
  background:           T.grad,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor:  'transparent',
  backgroundClip:       'text',
};

export const skeletonStyle: React.CSSProperties = {
  background:         'linear-gradient(90deg, #0B1628 0px, #162340 200px, #0B1628 400px)',
  backgroundSize:     '800px 100%',
  animation:          'shimmer 1.6s ease-in-out infinite',
  borderRadius:       10,
};

export const transition = 'all 200ms ease-out';
