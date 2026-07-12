import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { formatINR , parseAmountToMinor } from '@/lib/money';

import { useExpenseStore } from '@/state/expense-store';
import { mono, paper, type } from '@/theme';

/** Per-category monthly limit editor. Enter rupees; blank or 0 clears the budget. */
export function BudgetEditor() {
  const { categories, budgets, setBudget } = useExpenseStore();
  const [drafts, setDrafts] = useState<Record<number, string>>({});

  async function commit(categoryId: number) {
    const text = drafts[categoryId];
    if (text === undefined) return;
    const minor = text.trim() === '' ? 0 : (parseAmountToMinor(text) ?? -1);
    if (minor < 0) return; // unparseable — leave as-is
    await setBudget(categoryId, minor);
    setDrafts((d) => {
      const { [categoryId]: _done, ...rest } = d;
      return rest;
    });
  }

  return (
    <View style={styles.wrap}>
      {categories.map((c) => {
        const limit = budgets.find((b) => b.categoryId === c.id)?.limitMinor;
        return (
          <View key={c.id} style={styles.row}>
            <View style={[styles.swatch, { backgroundColor: c.color }]} />
            <Text style={styles.name} numberOfLines={1}>
              {c.name}
            </Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              placeholder={limit !== undefined ? String(limit / 100) : '—'}
              value={drafts[c.id] ?? ''}
              onChangeText={(t) => setDrafts((d) => ({ ...d, [c.id]: t }))}
              onBlur={() => void commit(c.id)}
              accessibilityLabel={`Monthly budget for ${c.name}${limit !== undefined ? `, currently ${formatINR(limit)}` : ', not set'}`}
            />
          </View>
        );
      })}
      <Text style={styles.hint}>MONTHLY LIMIT IN ₹ · BLANK = NO BUDGET</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  swatch: { width: 14, height: 14, borderRadius: 2 },
  name: { ...type.body, fontWeight: '600', flex: 1 },
  input: {
    fontFamily: mono,
    borderWidth: 1.5,
    borderColor: paper.inkFaint,
    borderRadius: 3,
    backgroundColor: paper.card,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    color: paper.ink,
    width: 110,
    textAlign: 'right',
  },
  hint: { ...type.label, fontSize: 9, textAlign: 'center', marginTop: 2 },
});
