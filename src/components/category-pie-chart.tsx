import { StyleSheet, Text, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';

import { toPieSlices } from '@/lib/chart';
import { formatINR } from '@/lib/money';
import { mono, paper } from '@/theme';
import type { Category, CategoryTotal } from '@/types';

interface CategoryPieChartProps {
  totals: readonly CategoryTotal[];
  categories: readonly Category[];
}

export function CategoryPieChart({ totals, categories }: CategoryPieChartProps) {
  const slices = toPieSlices(totals, categories);
  if (slices.length === 0) return null;

  return (
    <View style={styles.container}>
      <PieChart
        data={slices}
        donut
        radius={80}
        innerRadius={50}
        backgroundColor={paper.bg}
        innerCircleColor={paper.bg}
      />
      <View style={styles.legend}>
        {slices.map((s) => (
          <View key={s.label} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: s.color }]} />
            <Text style={styles.legendLabel}>{s.label}</Text>
            <Text style={styles.legendValue}>{formatINR(s.value)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 8 },
  legend: { flex: 1, gap: 6 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 2 },
  legendLabel: { flex: 1, fontFamily: mono, fontSize: 12, color: paper.ink },
  legendValue: { fontFamily: mono, fontSize: 12, fontWeight: '700', color: paper.ink },
});
