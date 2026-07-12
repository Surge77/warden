import { StyleSheet, Text, View } from 'react-native';

import { formatINR } from '@/lib/money';
import { mono, paper, type } from '@/theme';
import type { BudgetStatus, Category } from '@/types';

const WARN_RATIO = 0.8;

interface BudgetBarsProps {
  statuses: readonly BudgetStatus[];
  categories: readonly Category[];
}

/** Receipt-style budget meters: FOOD ████░░ 78% with over-budget in stamp red. */
export function BudgetBars({ statuses, categories }: BudgetBarsProps) {
  if (statuses.length === 0) return null;

  return (
    <View style={styles.wrap}>
      {statuses.map((s) => {
        const name = categories.find((c) => c.id === s.categoryId)?.name ?? '?';
        const over = s.ratio >= 1;
        const warn = !over && s.ratio >= WARN_RATIO;
        const pct = Math.min(s.ratio, 1);
        return (
          <View
            key={s.categoryId}
            style={styles.row}
            accessibilityLabel={`${name} budget ${Math.round(s.ratio * 100)} percent used`}
          >
            <Text style={styles.name} numberOfLines={1}>
              {name.toUpperCase()}
            </Text>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  { width: `${pct * 100}%` },
                  warn && styles.fillWarn,
                  over && styles.fillOver,
                ]}
              />
            </View>
            <Text style={[styles.pct, over && styles.pctOver]}>
              {over ? `OVER ${formatINR(s.spentMinor - s.limitMinor)}` : `${Math.round(s.ratio * 100)}%`}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { ...type.label, fontSize: 11, width: 88 },
  track: {
    flex: 1,
    height: 10,
    backgroundColor: paper.card,
    borderWidth: 1,
    borderColor: paper.inkFaint,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: paper.success },
  fillWarn: { backgroundColor: '#C98A0B' },
  fillOver: { backgroundColor: paper.danger },
  pct: { fontFamily: mono, fontSize: 11, fontWeight: '700', color: paper.ink, minWidth: 44, textAlign: 'right' },
  pctOver: { color: paper.danger },
});
