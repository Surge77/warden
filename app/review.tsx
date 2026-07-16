import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { WarrantyFields } from '@/components/warranty-fields';
import { db } from '@/db/client';
import { FREE_ITEM_LIMIT, canAddItem } from '@/lib/pro';
import {
  buildExpenseFromForm,
  isFormSavable,
  parsedToInitialForm,
} from '@/services/expense-draft';
import { SETTING_KEYS, createSettingsRepository } from '@/services/settings-repository';
import { useExpenseStore } from '@/state/expense-store';
import { layout, mono, paper } from '@/theme';

export default function ReviewScreen() {
  const params = useLocalSearchParams<{ imageUri?: string; rawText?: string }>();
  const rawText = params.rawText ?? '';
  const { categories, addExpense, loadCategories, suggestCategoryId } = useExpenseStore();

  const initial = useMemo(() => parsedToInitialForm(rawText), [rawText]);

  const [amount, setAmount] = useState(initial.amount);
  const [date, setDate] = useState(initial.date);
  const [merchant, setMerchant] = useState(initial.merchant);
  const [note, setNote] = useState(initial.note);
  const [categoryName, setCategoryName] = useState(initial.categoryName);
  const [warranty, setWarranty] = useState({
    itemName: initial.itemName,
    returnWindowDays: initial.returnWindowDays,
    warrantyMonths: initial.warrantyMonths,
  });
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  // Learned merchant→category beats the keyword guess, once, on the OCR'd merchant.
  useEffect(() => {
    if (!initial.merchant) return;
    void suggestCategoryId(initial.merchant).then((id) => {
      const learned = useExpenseStore.getState().categories.find((c) => c.id === id);
      if (learned) setCategoryName(learned.name);
    });
  }, [initial.merchant, suggestCategoryId]);

  const form = { amount, date, merchant, note, categoryName, ...warranty };
  const canSave = isFormSavable(form);

  async function onSave() {
    const draft = buildExpenseFromForm(form, categories, params.imageUri ?? null, rawText);
    if (!draft) return;
    const isPro = await createSettingsRepository(db).getBool(SETTING_KEYS.proUnlocked);
    if (!canAddItem(useExpenseStore.getState().expenses.length, isPro)) {
      Alert.alert(
        'Free limit reached',
        `The free tier tracks ${FREE_ITEM_LIMIT} items. Unlock Warden Pro in Settings for unlimited items.`,
      );
      return;
    }
    try {
      await addExpense(draft);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.replace('/');
    } catch (e) {
      if (__DEV__) console.error('Failed to save expense', e);
      Alert.alert('Could not save', 'Something went wrong saving this expense. Please try again.');
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Field label="Amount (₹)">
        <TextInput
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          style={styles.input}
          placeholder="0.00"
          accessibilityLabel="Amount in rupees"
        />
      </Field>

      <Field label="Date">
        <Pressable
          onPress={() => setShowPicker(true)}
          accessibilityRole="button"
          accessibilityLabel={`Date ${date}, tap to change`}
        >
          <Text style={[styles.input, styles.dateText]}>{date}</Text>
        </Pressable>
        {showPicker ? (
          <DateTimePicker
            value={dayjs(date).isValid() ? dayjs(date).toDate() : new Date()}
            mode="date"
            maximumDate={new Date()}
            onChange={(event, selected) => {
              setShowPicker(false);
              if (event.type === 'set' && selected) setDate(dayjs(selected).format('YYYY-MM-DD'));
            }}
          />
        ) : null}
      </Field>

      <Field label="Merchant">
        <TextInput
          value={merchant}
          onChangeText={setMerchant}
          style={styles.input}
          placeholder="Where you spent"
          accessibilityLabel="Merchant"
        />
      </Field>

      <Field label="Category">
        <View style={styles.chips}>
          {categories.map((c) => {
            const active = c.name === categoryName;
            return (
              <Pressable
                key={c.id}
                onPress={() => setCategoryName(c.name)}
                style={[styles.chip, active && { backgroundColor: c.color }]}
                accessibilityRole="button"
                accessibilityLabel={`Category ${c.name}`}
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.name}</Text>
              </Pressable>
            );
          })}
        </View>
      </Field>

      <WarrantyFields
        value={warranty}
        onChange={(patch) => setWarranty((prev) => ({ ...prev, ...patch }))}
      />

      <Field label="Note (optional)">
        <TextInput
          value={note}
          onChangeText={setNote}
          style={styles.input}
          placeholder="Add a note"
          accessibilityLabel="Note"
        />
      </Field>

      <Pressable
        style={[styles.save, !canSave && styles.saveDisabled]}
        onPress={onSave}
        disabled={!canSave}
        accessibilityRole="button"
      >
        <Text style={styles.saveText}>Save item</Text>
      </Pressable>
    </ScrollView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: layout.screenPad, gap: 16, backgroundColor: paper.bg },
  field: { gap: 6 },
  label: {
    fontFamily: mono,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: paper.inkFaded,
  },
  input: {
    fontFamily: mono,
    borderWidth: 1.5,
    borderColor: paper.ink,
    borderRadius: 3,
    backgroundColor: paper.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: paper.ink,
  },
  dateText: { paddingVertical: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
  save: {
    backgroundColor: paper.accent,
    borderRadius: 3,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  saveDisabled: { opacity: 0.4 },
  saveText: {
    fontFamily: mono,
    color: paper.bg,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
