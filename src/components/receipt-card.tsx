import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

import { paper } from '@/theme';

const TOOTH_WIDTH = 12;
const TOOTH_HEIGHT = 7;
const TOOTH_COUNT = 40;

/** Serrated tear edge, like the bottom of a printed receipt. */
export function ZigzagEdge({ color = paper.card, flip = false }: { color?: string; flip?: boolean }) {
  const width = TOOTH_WIDTH * TOOTH_COUNT;
  const points: string[] = [flip ? `0,${TOOTH_HEIGHT}` : '0,0'];
  for (let i = 0; i < TOOTH_COUNT; i++) {
    const x = i * TOOTH_WIDTH;
    if (flip) {
      points.push(`${x + TOOTH_WIDTH / 2},0`, `${x + TOOTH_WIDTH},${TOOTH_HEIGHT}`);
    } else {
      points.push(`${x + TOOTH_WIDTH / 2},${TOOTH_HEIGHT}`, `${x + TOOTH_WIDTH},0`);
    }
  }
  return (
    <Svg
      width="100%"
      height={TOOTH_HEIGHT}
      viewBox={`0 0 ${width} ${TOOTH_HEIGHT}`}
      preserveAspectRatio="none"
    >
      <Polygon points={points.join(' ')} fill={color} />
    </Svg>
  );
}

/** Paper card with serrated top and bottom edges. */
export function ReceiptCard({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return (
    <View style={styles.shadowWrap}>
      <ZigzagEdge flip />
      <View style={[styles.body, style]}>{children}</View>
      <ZigzagEdge />
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    shadowColor: paper.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.9,
    shadowRadius: 0,
    elevation: 3,
  },
  body: { backgroundColor: paper.card, paddingHorizontal: 18, paddingVertical: 14 },
});
