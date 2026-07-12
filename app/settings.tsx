import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import { useFocusEffect } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { BudgetEditor } from '@/components/budget-editor';
import { useToast } from '@/components/toast';
import { db } from '@/db/client';
import { exportBackup, parseBackup, restoreBackup } from '@/services/backup';
import { disableDailyReminder, enableDailyReminder } from '@/services/reminders';
import { createSettingsRepository, SETTING_KEYS } from '@/services/settings-repository';
import { useExpenseStore } from '@/state/expense-store';
import { layout, mono, paper, type } from '@/theme';

const settingsRepo = createSettingsRepository(db);

const PALETTE = [
  '#EF4444',
  '#F59E0B',
  '#22C55E',
  '#14B8A6',
  '#3B82F6',
  '#A855F7',
  '#EC4899',
  '#6B7280',
] as const;

export default function SettingsScreen() {
  const { categories, loadCategories, addCategory, loadBudgets, loadExpenses } = useExpenseStore();
  const show = useToast((s) => s.show);
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(PALETTE[0]);
  const [reminderOn, setReminderOn] = useState(false);
  const [lockOn, setLockOn] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void loadCategories();
      void loadBudgets();
    }, [loadCategories, loadBudgets]),
  );

  useEffect(() => {
    void settingsRepo.getBool(SETTING_KEYS.dailyReminder).then(setReminderOn);
    void settingsRepo.getBool(SETTING_KEYS.appLock).then(setLockOn);
  }, []);

  async function onToggleReminder(value: boolean) {
    setReminderOn(value);
    if (value) {
      const granted = await enableDailyReminder();
      if (!granted) {
        setReminderOn(false);
        show('Notification permission denied.');
        return;
      }
    } else {
      await disableDailyReminder();
    }
    await settingsRepo.setBool(SETTING_KEYS.dailyReminder, value);
  }

  async function onToggleLock(value: boolean) {
    setLockOn(value);
    await settingsRepo.setBool(SETTING_KEYS.appLock, value);
  }

  async function onExportBackup() {
    try {
      const json = await exportBackup(db, Date.now());
      const file = new File(Paths.cache, 'warden-backup.json');
      file.create({ overwrite: true });
      file.write(json);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Warden backup',
        });
      }
    } catch {
      show('Backup export failed.');
    }
  }

  async function onImportBackup() {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
    const asset = result.canceled ? undefined : result.assets[0];
    if (!asset) return;
    let backup;
    try {
      backup = parseBackup(await new File(asset.uri).text());
    } catch (e) {
      show(e instanceof Error ? e.message : 'Invalid backup file.');
      return;
    }
    Alert.alert('Restore backup?', 'This replaces ALL current data with the backup.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Restore',
        style: 'destructive',
        onPress: async () => {
          try {
            await restoreBackup(db, backup);
            await Promise.all([loadCategories(), loadBudgets(), loadExpenses()]);
            show('Backup restored.');
          } catch {
            show('Restore failed.');
          }
        },
      },
    ]);
  }

  const trimmed = name.trim();
  const canAdd = trimmed.length > 0;

  async function onAdd() {
    if (!canAdd) return;
    try {
      await addCategory(trimmed, color);
      setName('');
    } catch (e) {
      if (__DEV__) console.error('Failed to add category', e);
      Alert.alert('Could not add', 'Something went wrong adding this category. Please try again.');
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.sectionTitle}>* CATEGORIES *</Text>
      {categories.map((c) => (
        <View key={c.id} style={styles.row} accessibilityLabel={`Category ${c.name}`}>
          <View style={[styles.swatch, { backgroundColor: c.color }]} />
          <Text style={styles.rowLabel}>{c.name}</Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>* ADD CATEGORY *</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        style={styles.input}
        placeholder="Category name"
        accessibilityLabel="New category name"
      />

      <View style={styles.palette}>
        {PALETTE.map((c) => {
          const active = c === color;
          return (
            <Pressable
              key={c}
              onPress={() => setColor(c)}
              style={[styles.colorDot, { backgroundColor: c }, active && styles.colorDotActive]}
              accessibilityRole="button"
              accessibilityLabel={`Color ${c}`}
              accessibilityState={{ selected: active }}
            />
          );
        })}
      </View>

      <Pressable
        style={[styles.save, !canAdd && styles.saveDisabled]}
        onPress={onAdd}
        disabled={!canAdd}
        accessibilityRole="button"
        accessibilityLabel="Add category"
      >
        <Text style={styles.saveText}>Add category</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>* MONTHLY BUDGETS *</Text>
      <BudgetEditor />

      <Text style={styles.sectionTitle}>* PREFERENCES *</Text>
      <View style={styles.prefRow}>
        <Text style={styles.prefLabel}>DAILY 9PM REMINDER</Text>
        <Switch
          value={reminderOn}
          onValueChange={(v) => void onToggleReminder(v)}
          trackColor={{ true: paper.accent }}
          accessibilityLabel="Daily reminder"
        />
      </View>
      <View style={styles.prefRow}>
        <Text style={styles.prefLabel}>FINGERPRINT LOCK</Text>
        <Switch
          value={lockOn}
          onValueChange={(v) => void onToggleLock(v)}
          trackColor={{ true: paper.accent }}
          accessibilityLabel="Fingerprint lock"
        />
      </View>

      <Text style={styles.sectionTitle}>* BACKUP *</Text>
      <View style={styles.backupRow}>
        <Pressable
          style={styles.backupButton}
          onPress={() => void onExportBackup()}
          accessibilityRole="button"
        >
          <Text style={styles.backupButtonText}>EXPORT</Text>
        </Pressable>
        <Pressable
          style={styles.backupButton}
          onPress={() => void onImportBackup()}
          accessibilityRole="button"
        >
          <Text style={styles.backupButtonText}>RESTORE</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: layout.screenPad, gap: 12, backgroundColor: paper.bg },
  sectionTitle: { ...type.label, textAlign: 'center', marginTop: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    ...layout.tearline,
  },
  swatch: { width: 18, height: 18, borderRadius: 2 },
  rowLabel: { ...type.body, fontWeight: '600' },
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
  palette: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  colorDot: { width: 32, height: 32, borderRadius: 3 },
  colorDotActive: { borderWidth: 3, borderColor: paper.ink },
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
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  prefLabel: { ...type.label, fontSize: 12, color: paper.ink },
  backupRow: { flexDirection: 'row', gap: 10 },
  backupButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: paper.ink,
    borderRadius: 3,
    paddingVertical: 12,
    alignItems: 'center',
  },
  backupButtonText: {
    fontFamily: mono,
    color: paper.ink,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 2,
  },
});
