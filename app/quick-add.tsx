import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useToast } from '@/components/toast';
import { parseAmountToMinor } from '@/lib/money';
import { useExpenseStore } from '@/state/expense-store';
import { layout, mono, paper, type } from '@/theme';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'] as const;
const MAX_DIGITS = 9;

export default function QuickAddScreen() {
  const { categories, loadCategories, addExpense } = useExpenseStore();
  const show = useToast((s) => s.show);
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  function onKey(key: (typeof KEYS)[number]) {
    void Haptics.selectionAsync().catch(() => {});
    setAmount((prev) => {
      if (key === '⌫') return prev.slice(0, -1);
      if (key === '.' && (prev.includes('.') || prev === '')) return prev;
      if (prev.replace('.', '').length >= MAX_DIGITS) return prev;
      const [, decimals] = prev.split('.');
      if (decimals !== undefined && decimals.length >= 2) return prev;
      return prev + key;
    });
  }

  const amountMinor = parseAmountToMinor(amount);
  const canSave = amountMinor !== null && amountMinor > 0 && !saving;

  async function onSave() {
    if (amountMinor === null || amountMinor <= 0 || saving) return;
    setSaving(true);
    try {
      await addExpense({ amountMinor, spentAt: Date.now(), categoryId });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      show('Expense logged.');
      router.back();
    } catch {
      show('Could not save. Try again.');
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={type.label}>AMOUNT</Text>
      <Text style={styles.amount} accessibilityLabel={`Amount ${amount || 'zero'} rupees`}>
        ₹{amount || '0'}
      </Text>

      <View style={styles.chips}>
        {categories.map((c) => {
          const active = c.id === categoryId;
          return (
            <Pressable
              key={c.id}
              onPress={() => setCategoryId(active ? null : c.id)}
              style={[styles.chip, active && { backgroundColor: c.color, borderColor: c.color }]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`Category ${c.name}`}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.name}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.pad}>
        {KEYS.map((key) => (
          <Pressable
            key={key}
            onPress={() => onKey(key)}
            style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
            accessibilityRole="button"
            accessibilityLabel={key === '⌫' ? 'Delete digit' : `Digit ${key}`}
          >
            <Text style={styles.keyText}>{key}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={onSave}
        disabled={!canSave}
        style={[styles.save, !canSave && styles.saveDisabled]}
        accessibilityRole="button"
        accessibilityLabel="Save expense"
      >
        <Text style={styles.saveText}>{saving ? 'SAVING…' : 'SAVE'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: layout.screenPad, backgroundColor: paper.bg },
  amount: { ...type.amount, fontFamily: mono, fontSize: 44, marginTop: 4, marginBottom: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: paper.inkFaint,
    backgroundColor: paper.card,
  },
  chipText: {
    fontFamily: mono,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: paper.ink,
  },
  chipTextActive: { color: paper.bg, fontWeight: '700' },
  pad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 'auto',
    marginBottom: 12,
  },
  key: {
    width: '31%',
    flexGrow: 1,
    aspectRatio: 1.6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: paper.card,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: paper.inkFaint,
  },
  keyPressed: { backgroundColor: paper.inkFaint },
  keyText: { fontFamily: mono, fontSize: 22, fontWeight: '700', color: paper.ink },
  save: {
    backgroundColor: paper.accent,
    borderRadius: 3,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveDisabled: { opacity: 0.4 },
  saveText: {
    fontFamily: mono,
    color: paper.bg,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 2,
  },
});
