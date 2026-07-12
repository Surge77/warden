import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { InkButton } from '@/components/ink-button';
import { ReceiptCard } from '@/components/receipt-card';
import { useToast } from '@/components/toast';
import { db, schema } from '@/db/client';
import { monthKey } from '@/lib/date';
import { formatINR } from '@/lib/money';
import { createExpenseRepository } from '@/services/expense-repository';
import { useExpenseStore } from '@/state/expense-store';
import { layout, mono, paper, type } from '@/theme';
import type { Expense } from '@/types';

const repo = createExpenseRepository(db);

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const expenseId = Number(id);
  const deleteExpense = useExpenseStore((s) => s.deleteExpense);
  const addExpense = useExpenseStore((s) => s.addExpense);
  const show = useToast((s) => s.show);
  const [expense, setExpense] = useState<Expense | null>(null);
  const [categoryName, setCategoryName] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isInteger(expenseId)) return; // malformed/absent route param
    void repo.getById(expenseId).then(async (e) => {
      setExpense(e);
      if (e?.categoryId != null) {
        const cats = await db.select().from(schema.categories);
        setCategoryName(cats.find((c) => c.id === e.categoryId)?.name ?? null);
      }
    });
  }, [expenseId]);

  if (!expense) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>EXPENSE NOT FOUND</Text>
      </View>
    );
  }

  function onDelete() {
    const snapshot = expense;
    if (!snapshot) return;
    Alert.alert('Delete expense?', 'You can undo for a few seconds after.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteExpense(expenseId);
          router.back();
          show('Expense deleted.', 'UNDO', () => {
            void addExpense({
              amountMinor: snapshot.amountMinor,
              currency: snapshot.currency,
              merchant: snapshot.merchant,
              categoryId: snapshot.categoryId,
              spentAt: snapshot.spentAt,
              note: snapshot.note,
              imageUri: snapshot.imageUri,
              rawOcrText: snapshot.rawOcrText,
            });
          });
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <ReceiptCard>
        <Text style={styles.cardHeading}>*** RECEIPTLY ***</Text>
        <Text style={styles.cardSub}>EXPENSE RECORD №{String(expenseId).padStart(4, '0')}</Text>
        <View style={styles.tear} />
        <Detail label="MERCHANT" value={(expense.merchant ?? 'Unknown').toUpperCase()} />
        <Detail label="CATEGORY" value={(categoryName ?? 'Uncategorized').toUpperCase()} />
        <Detail label="DATE" value={monthKey(expense.spentAt)} />
        {expense.note ? <Detail label="NOTE" value={expense.note} /> : null}
        <View style={styles.tear} />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalValue}>{formatINR(expense.amountMinor)}</Text>
        </View>
        <View style={styles.doubleRule} />
      </ReceiptCard>

      <View style={styles.actions}>
        <InkButton label="Edit" onPress={() => router.push(`/edit/${expenseId}`)} />
        <InkButton label="Delete" variant="danger" onPress={onDelete} />
      </View>
    </View>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.dots} numberOfLines={1}>
        ....................
      </Text>
      <Text style={styles.value} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: layout.screenPad, backgroundColor: paper.bg },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: paper.bg,
  },
  muted: { ...type.label },
  cardHeading: { ...type.title, textAlign: 'center', marginTop: 4 },
  cardSub: {
    fontFamily: mono,
    fontSize: 11,
    letterSpacing: 1.5,
    color: paper.inkFaded,
    textAlign: 'center',
    marginTop: 4,
  },
  tear: { marginVertical: 12, ...layout.tearline },
  row: { flexDirection: 'row', alignItems: 'baseline', paddingVertical: 6, gap: 6 },
  label: { ...type.label, fontSize: 12 },
  dots: { ...type.body, color: paper.inkFaint, flex: 1 },
  value: { ...type.body, fontWeight: '600', maxWidth: '55%', textAlign: 'right' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  totalLabel: { ...type.title },
  totalValue: { ...type.amount, fontFamily: mono, fontSize: 28 },
  doubleRule: {
    marginTop: 10,
    borderBottomWidth: 3,
    borderTopWidth: 1,
    borderColor: paper.ink,
    height: 6,
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 'auto' },
});
