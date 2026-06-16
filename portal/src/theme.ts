import type React from 'react';

export const T = {
  bg:      '#040810',
  surface: '#070D1C',
  card:    '#0B1628',
  border:  '#2E3D54',
  text:    '#E8F2FF',
  muted:   '#6A7D9A',
  cyan:    '#00D4FF',
  purple:  '#7B5FFF',
  green:   '#00E887',
  amber:   '#FFB800',
  red:     '#FF4563',
  grad:    'linear-gradient(135deg, #00D4FF, #7B5FFF)',
} as const;

export const cardStyle: React.CSSProperties = {
  background:   T.card,
  border:       `1px solid ${T.border}`,
  borderRadius: 18,
};

export const gradientText: React.CSSProperties = {
  background:           T.grad,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor:  'transparent',
  backgroundClip:       'text',
};

export const transition = 'all 200ms ease-out';
