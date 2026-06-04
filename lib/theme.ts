import { StyleSheet } from 'react-native';

export const colors = {
  accent: '#635BFF',
  accentPress: '#4F46E5',
  accentSoft: '#ECEBFF',
  green: '#1E9E6A',
  greenSoft: '#E2F4EC',
  amber: '#C8860B',
  amberSoft: '#FBF0DA',
  red: '#E0483D',
  redSoft: '#FDE8E8',
  bg: '#F2F2F5',
  bgPattern: 'rgba(99,91,255,0.025)',
  surface: '#FFFFFF',
  surface2: '#F7F7F9',
  ink: '#0B0B12',
  muted: '#6B6B76',
  faint: '#9A9AA4',
  hairline: 'rgba(10,10,20,0.07)',
  hairline2: 'rgba(10,10,20,0.045)',
  white: '#FFFFFF',
  gradStart: '#8B7BFF',
  gradEnd: '#4B45D6',
  successGrad: ['#22C55E', '#16A34A'] as const,
  purpleGrad: ['#8B7BFF', '#4B45D6'] as const,
  warmGrad: ['#F59E0B', '#D97706'] as const,
  pinkGrad: ['#EC4899', '#BE185D'] as const,
  blueGrad: ['#3B82F6', '#1D4ED8'] as const,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 40,
} as const;

export const borderRadius = {
  sm: 14,
  md: 22,
  lg: 30,
  xl: 36,
  full: 100,
} as const;

function fw(w: string): any { return w; }

export const typography = StyleSheet.create({
  largeTitle: {
    fontSize: 32,
    fontWeight: fw('720'),
    letterSpacing: -0.8,
    lineHeight: 34,
    color: colors.ink,
  },
  title2: {
    fontSize: 21,
    fontWeight: fw('680'),
    letterSpacing: -0.4,
    color: colors.ink,
  },
  title3: {
    fontSize: 17,
    fontWeight: fw('660'),
    letterSpacing: -0.2,
    color: colors.ink,
  },
  body: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.ink,
  },
  caption: {
    fontSize: 13.5,
    fontWeight: '500',
    color: colors.muted,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: fw('640'),
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.faint,
  },
  badge: {
    fontSize: 12.5,
    fontWeight: fw('620'),
    letterSpacing: -0.1,
  },
  tabLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  mono: {
    fontSize: 11.5,
    fontWeight: '600',
    letterSpacing: 0.4,
    fontFamily: 'ui-monospace',
  },
});

export const shadows = {
  xs: {
    shadowColor: 'rgba(10,10,25,0.04)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: 'rgba(10,10,25,0.04)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: 'rgba(10,10,25,0.06)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 4,
  },
  lg: {
    shadowColor: 'rgba(10,10,25,0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
  glow: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 28,
    elevation: 8,
  },
} as const;

export const easings = {
  standard: { damping: 18, stiffness: 200, mass: 0.9 },
  gentle: { damping: 20, stiffness: 180, mass: 1 },
  bouncy: { damping: 12, stiffness: 220, mass: 0.7 },
  snappy: { damping: 22, stiffness: 280, mass: 0.7 },
} as const;

export const theme = {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
  easings,
};
