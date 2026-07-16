import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { DeadlineDocket } from '@/components/deadline-docket';
import { InkButton } from '@/components/ink-button';
import { VaultDial } from '@/components/vault-dial';
import { monthKey } from '@/lib/date';
import { formatINR } from '@/lib/money';
import { nextDeadline, protectionSummary } from '@/lib/warranty';
import { useExpenseStore } from '@/state/expense-store';
import { layout, mono, paper, type } from '@/theme';

const DAY_MS = 24 * 60 * 60 * 1000;

export default function DashboardScreen() {
  const { expenses, categories, loadExpenses, loadMonth, loadCategories, loadBudgets } =
    useExpenseStore();

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

  const protection = useMemo(() => protectionSummary(expenses, now), [expenses, now]);
  const categoryColor = useCallback(
    (id: number | null) => categories.find((c) => c.id === id)?.color ?? paper.inkFaint,
    [categories],
  );

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.duration(400)} style={styles.dialWrap}>
        <VaultDial
          protectedValueMinor={protection.protectedValueMinor}
          protectedCount={protection.protectedCount}
          totalCount={expenses.length}
          expiringSoonCount={protection.expiringSoonCount}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(80)}>
        <DeadlineDocket expenses={expenses} nowMs={now} />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(160)} style={styles.ledger}>
        <Text style={styles.section}>IN THE VAULT</Text>
        <FlatList
          data={expenses.slice(0, 12)}
          keyExtractor={(e) => String(e.id)}
          ListEmptyComponent={<Text style={styles.empty}>EMPTY VAULT — SCAN YOUR FIRST RECEIPT</Text>}
          renderItem={({ item }) => {
            const deadline = nextDeadline(
              {
                purchaseDateMs: item.spentAt,
                returnWindowDays: item.returnWindowDays,
                warrantyMonths: item.warrantyMonths,
              },
              now,
            );
            const daysLeft = deadline ? Math.ceil((deadline.atMs - now) / DAY_MS) : null;
            return (
              <Link href={{ pathname: '/expense/[id]', params: { id: item.id } }} asChild>
                <Pressable style={styles.row}>
                  <View style={[styles.spine, { backgroundColor: categoryColor(item.categoryId) }]} />
                  <View style={styles.rowBody}>
                    <Text style={styles.rowName} numberOfLines={1}>
                      {(item.itemName ?? item.merchant ?? 'Unknown').toUpperCase()}
                    </Text>
                    <Text style={styles.rowAmount}>{formatINR(item.amountMinor)}</Text>
                  </View>
                  {daysLeft !== null ? (
                    <View style={[styles.pill, daysLeft <= 7 && styles.pillUrgent]}>
                      <Text style={[styles.pillText, daysLeft <= 7 && styles.pillTextUrgent]}>
                        {daysLeft}D
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.pillNone}>—</Text>
                  )}
                </Pressable>
              </Link>
            );
          }}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(240)}>
        <View style={styles.scanRow}>
          <Link href="/capture" asChild>
            <InkButton label="Scan a receipt" variant="primary" />
          </Link>
        </View>
        <View style={styles.navRow}>
          <Link href="/quick-add" asChild>
            <Pressable style={styles.navItem}>
              <Text style={styles.navText}>+ QUICK</Text>
            </Pressable>
          </Link>
          <Text style={styles.navDivider}>·</Text>
          <Link href="/history" asChild>
            <Pressable style={styles.navItem}>
              <Text style={styles.navText}>HISTORY</Text>
            </Pressable>
          </Link>
          <Text style={styles.navDivider}>·</Text>
          <Link href="/settings" asChild>
            <Pressable style={styles.navItem}>
              <Text style={styles.navText}>SETUP</Text>
            </Pressable>
          </Link>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: layout.screenPad, backgroundColor: paper.bg },
  dialWrap: { alignItems: 'center', marginTop: 2 },
  section: {
    ...type.label,
    color: paper.inkFaded,
    marginTop: 16,
    marginBottom: 8,
  },
  ledger: { flex: 1, minHeight: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: paper.inkFaint,
  },
  spine: { width: 3, alignSelf: 'stretch', borderRadius: 1.5 },
  rowBody: { flex: 1, gap: 2 },
  rowName: { ...type.body, fontSize: 12.5, fontWeight: '600' },
  rowAmount: { fontFamily: mono, fontSize: 11, color: paper.inkFaded },
  pill: {
    borderWidth: 1,
    borderColor: paper.accent,
    borderRadius: 2,
    paddingHorizontal: 7,
    paddingVertical: 3,
    minWidth: 42,
    alignItems: 'center',
  },
  pillUrgent: { borderColor: paper.danger, backgroundColor: paper.dangerSoft },
  pillText: { fontFamily: mono, fontSize: 11, fontWeight: '700', color: paper.accent },
  pillTextUrgent: { color: paper.danger },
  pillNone: { fontFamily: mono, fontSize: 11, color: paper.inkFaint, minWidth: 42, textAlign: 'center' },
  empty: { ...type.label, textAlign: 'center', paddingVertical: 20 },
  scanRow: { flexDirection: 'row' },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    marginTop: 14,
    marginBottom: 2,
  },
  navItem: { paddingVertical: 6, paddingHorizontal: 4 },
  navText: { fontFamily: mono, fontSize: 11, letterSpacing: 2, color: paper.inkFaded },
  navDivider: { color: paper.inkFaint, fontFamily: mono },
});
