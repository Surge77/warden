import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

import { formatINR } from '@/lib/money';
import { mono, paper } from '@/theme';

const SIZE = 240;
const CENTER = SIZE / 2;
const OUTER_R = 104;
const INNER_R = 84;
const STROKE = 10;
const TICK_COUNT = 48;
const TICK_INNER = 112;
const TICK_OUTER = 118;

interface VaultDialProps {
  protectedValueMinor: number;
  protectedCount: number;
  totalCount: number;
  expiringSoonCount: number;
}

function arcProps(radius: number, fraction: number) {
  const circumference = 2 * Math.PI * radius;
  return {
    strokeDasharray: `${circumference}`,
    strokeDashoffset: circumference * (1 - Math.min(Math.max(fraction, 0), 1)),
  };
}

/** Brass instrument dial: coverage arc outside, urgency arc inside. */
export function VaultDial({
  protectedValueMinor,
  protectedCount,
  totalCount,
  expiringSoonCount,
}: VaultDialProps) {
  const coverage = totalCount > 0 ? protectedCount / totalCount : 0;
  const urgency = protectedCount > 0 ? expiringSoonCount / protectedCount : 0;

  const ticks = Array.from({ length: TICK_COUNT }, (_, i) => {
    const angle = (i / TICK_COUNT) * Math.PI * 2;
    const major = i % 4 === 0;
    const r1 = major ? TICK_INNER - 3 : TICK_INNER;
    return (
      <Line
        key={i}
        x1={CENTER + r1 * Math.cos(angle)}
        y1={CENTER + r1 * Math.sin(angle)}
        x2={CENTER + TICK_OUTER * Math.cos(angle)}
        y2={CENTER + TICK_OUTER * Math.sin(angle)}
        stroke={major ? paper.accent : paper.inkFaint}
        strokeWidth={major ? 1.6 : 1}
        opacity={major ? 0.8 : 0.6}
      />
    );
  });

  return (
    <View style={styles.wrap}>
      <Svg width={SIZE} height={SIZE}>
        {ticks}
        <Circle cx={CENTER} cy={CENTER} r={OUTER_R} stroke={paper.card} strokeWidth={STROKE} fill="none" />
        <Circle cx={CENTER} cy={CENTER} r={INNER_R} stroke={paper.card} strokeWidth={STROKE} fill="none" />
        {coverage > 0 ? (
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={OUTER_R}
            stroke={paper.accent}
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="none"
            transform={`rotate(-90 ${CENTER} ${CENTER})`}
            {...arcProps(OUTER_R, coverage)}
          />
        ) : null}
        {urgency > 0 ? (
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={INNER_R}
            stroke={paper.danger}
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="none"
            transform={`rotate(-90 ${CENTER} ${CENTER})`}
            {...arcProps(INNER_R, urgency)}
          />
        ) : null}
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <Text style={styles.label}>VALUE PROTECTED</Text>
        <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
          {formatINR(protectedValueMinor)}
        </Text>
        <Text style={styles.sub}>
          {protectedCount} UNDER GUARD
          {expiringSoonCount > 0 ? ` · ${expiringSoonCount} ENDING SOON` : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', alignItems: 'center', maxWidth: 132 },
  label: { fontFamily: mono, fontSize: 9, letterSpacing: 2, color: paper.inkFaded },
  value: { fontFamily: mono, fontSize: 26, fontWeight: '700', color: paper.ink, marginTop: 4 },
  sub: {
    fontFamily: mono,
    fontSize: 8.5,
    letterSpacing: 1,
    color: paper.accent,
    marginTop: 5,
    textAlign: 'center',
  },
});
