import { Platform } from 'react-native';

// Horological-vault design language: deep ink-green walls, pine ledger
// cards, aged-brass accents, cream printer ink. Receipts read like paper
// filed in a dark bank vault. All screens share these tokens.
export const paper = {
  bg: '#0B1611',
  card: '#152420',
  cardShadow: '#040806',
  ink: '#EDE5CF',
  inkFaded: '#8FA391',
  inkFaint: '#31453A',
  accent: '#C9A96A',
  accentSoft: '#2B2A1C',
  success: '#8CBB94',
  danger: '#E0552E',
  dangerSoft: '#3B1D14',
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
