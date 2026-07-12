import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { BudgetBars } from '@/components/budget-bars';
import { CategoryPieChart } from '@/components/category-pie-chart';
import { InkButton } from '@/components/ink-button';
import { ReceiptCard } from '@/components/receipt-card';
import { monthKey } from '@/lib/date';
import { formatINR } from '@/lib/money';
import { protectionSummary } from '@/lib/warranty';
import { weeklyInsight } from '@/services/insights';
import { useExpenseStore } from '@/state/expense-store';
import { layout, mono, paper, type } from '@/theme';

export default function DashboardScreen() {
  const {
    expenses,
    monthTotals,
    categories,
    budgetStatuses,
    loadExpenses,
    loadMonth,
    loadCategories,
    loadBudgets,
  } = useExpenseStore();

  const [now, setNow] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const focusedAt = Date.now();
      setNow(focusedAt);
      void loadCategories();
      void loadExpenses();
      void loadBudgets().then(() => loadMonth(monthKey(focusedAt)));
    }, [loadCategories, loadExpenses, loadBudgets, loadMonth]),
  );

  const monthTotal = monthTotals.reduce((sum, t) => sum + t.totalMinor, 0);
  const week = useMemo(() => weeklyInsight(expenses, now), [expenses, now]);
  const weekTopName = categories.find((c) => c.id === week.topCategoryId)?.name;
  const protection = useMemo(() => protectionSummary(expenses, now), [expenses, now]);

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.duration(350)}>
        <ReceiptCard>
          <Text style={type.label}>Value protected · under warranty</Text>
        <Text style={styles.totalValue}>{formatINR(protection.protectedValueMinor)}</Text>
        <Text style={styles.weekLine} numberOfLines={1}>
          {protection.protectedCount} ITEM{protection.protectedCount === 1 ? '' : 'S'} COVERED
          {protection.expiringSoonCount > 0
            ? ` · ⚠ ${protection.expiringSoonCount} EXPIRING SOON`
            : ''}
          {` · ${formatINR(monthTotal)} THIS MONTH`}
        </Text>
        {week.count > 0 && weekTopName ? (
          <Text style={styles.weekLine} numberOfLines={1}>
            7D {formatINR(week.totalMinor)} · TOP {weekTopName.toUpperCase()}
          </Text>
        ) : null}
        <View style={styles.totalRule} />
        </ReceiptCard>
      </Animated.View>

      {budgetStatuses.length > 0 ? (
        <>
          <Text style={styles.divider}>* BUDGETS *</Text>
          <BudgetBars statuses={budgetStatuses} categories={categories} />
        </>
      ) : null}

      <Text style={styles.divider}>* BY CATEGORY *</Text>
      {monthTotals.length === 0 ? (
        <Text style={styles.empty}>NO SPENDING RECORDED YET</Text>
      ) : (
        <CategoryPieChart totals={monthTotals} categories={categories} />
      )}

      <Text style={styles.divider}>* RECENT *</Text>
      <FlatList
        data={expenses.slice(0, 10)}
        keyExtractor={(e) => String(e.id)}
        ListEmptyComponent={<Text style={styles.empty}>SNAP YOUR FIRST RECEIPT</Text>}
        renderItem={({ item }) => (
          <Link href={{ pathname: '/expense/[id]', params: { id: item.id } }} asChild>
            <Pressable style={styles.row}>
              <Text style={styles.rowLabel} numberOfLines={1}>
                {(item.itemName ?? item.merchant ?? 'Unknown').toUpperCase()}
              </Text>
              <Text style={styles.rowDots} numberOfLines={1}>
                ............................
              </Text>
              <Text style={styles.rowValue}>{formatINR(item.amountMinor)}</Text>
            </Pressable>
          </Link>
        )}
      />

      <View style={styles.actionsTop}>
        <Link href="/settings" asChild>
          <InkButton label="Setup" variant="ghost" />
        </Link>
        <Link href="/history" asChild>
          <InkButton label="History" variant="ghost" />
        </Link>
      </View>
      <View style={styles.actions}>
        <Link href="/quick-add" asChild>
          <InkButton label="+ Quick" variant="primary" />
        </Link>
        <Link href="/capture" asChild>
          <InkButton label="📷 Scan" />
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: layout.screenPad, gap: 10, backgroundColor: paper.bg },
  totalValue: { ...type.display, ...type.amount, fontSize: 40, marginTop: 6 },
  totalRule: {
    marginTop: 12,
    borderBottomWidth: 3,
    borderBottomColor: paper.ink,
    borderStyle: 'solid',
  },
  divider: {
    ...type.label,
    color: paper.inkFaded,
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 4,
  },
  row: { flexDirection: 'row', alignItems: 'baseline', paddingVertical: 11, gap: 6 },
  rowLabel: { ...type.body, fontWeight: '600', flexShrink: 1 },
  rowDots: { ...type.body, color: paper.inkFaint, flex: 1 },
  rowValue: { ...type.body, ...type.amount, fontSize: 14 },
  empty: { ...type.label, textAlign: 'center', paddingVertical: 14 },
  weekLine: { fontFamily: mono, fontSize: 11, letterSpacing: 1, color: paper.inkFaded, marginTop: 6 },
  actionsTop: { flexDirection: 'row', gap: 10, marginTop: 'auto' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 10 },
});
