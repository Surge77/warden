import { Platform } from 'react-native';

// Thermal-receipt design language: warm paper, printer-ink mono type,
// vermillion stamp accent, dashed tear-lines. All screens share these tokens.
export const paper = {
  bg: '#F4EEE1',
  card: '#FFFDF6',
  cardShadow: '#D8CFBC',
  ink: '#221F1A',
  inkFaded: '#8A8171',
  inkFaint: '#C9C0AC',
  accent: '#D9482B',
  accentSoft: '#F6DCD4',
  success: '#3F6C45',
  danger: '#B3261E',
  dangerSoft: '#F3D9D6',
} as const;

export const mono = Platform.select({ android: 'monospace', ios: 'Menlo', default: 'monospace' });

export const type = {
  display: { fontFamily: mono, fontSize: 34, fontWeight: '700' as const, letterSpacing: -1 },
  title: {
    fontFamily: mono,
    fontSize: 15,
    fontWeight: '700' as const,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    color: paper.ink,
  },
  label: {
    fontFamily: mono,
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
    color: paper.inkFaded,
  },
  body: { fontFamily: mono, fontSize: 14, color: paper.ink },
  amount: { fontFamily: mono, fontWeight: '700' as const, color: paper.ink },
} as const;

export const layout = {
  screenPad: 20,
  radius: 3,
  tearline: {
    borderBottomWidth: 1,
    borderStyle: 'dashed' as const,
    borderBottomColor: paper.inkFaint,
  },
} as const;
