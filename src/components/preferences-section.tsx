import { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { db } from '@/db/client';
import { disableDailyReminder, enableDailyReminder } from '@/services/reminders';
import { SETTING_KEYS, createSettingsRepository } from '@/services/settings-repository';
import { mono, paper } from '@/theme';

const settingsRepo = createSettingsRepository(db);

interface PreferencesSectionProps {
  onPermissionDenied(): void;
}

/** The three settings toggles: daily reminder, fingerprint lock, Pro unlock. */
export function PreferencesSection({ onPermissionDenied }: PreferencesSectionProps) {
  const [reminderOn, setReminderOn] = useState(false);
  const [lockOn, setLockOn] = useState(false);
  const [proOn, setProOn] = useState(false);

  useEffect(() => {
    void settingsRepo.getBool(SETTING_KEYS.dailyReminder).then(setReminderOn);
    void settingsRepo.getBool(SETTING_KEYS.appLock).then(setLockOn);
    void settingsRepo.getBool(SETTING_KEYS.proUnlocked).then(setProOn);
  }, []);

  async function onToggleReminder(value: boolean) {
    setReminderOn(value);
    if (value) {
      const granted = await enableDailyReminder();
      if (!granted) {
        setReminderOn(false);
        onPermissionDenied();
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

  // Placeholder unlock: flips the local flag. Replaced by Play Billing before store release.
  async function onTogglePro(value: boolean) {
    setProOn(value);
    await settingsRepo.setBool(SETTING_KEYS.proUnlocked, value);
  }

  return (
    <>
      <PrefRow label="DAILY 9PM REMINDER" value={reminderOn} onChange={onToggleReminder} />
      <PrefRow label="FINGERPRINT LOCK" value={lockOn} onChange={onToggleLock} />
      <PrefRow label="WARDEN PRO (UNLIMITED ITEMS)" value={proOn} onChange={onTogglePro} />
    </>
  );
}

interface PrefRowProps {
  label: string;
  value: boolean;
  onChange(value: boolean): Promise<void>;
}

function PrefRow({ label, value, onChange }: PrefRowProps) {
  return (
    <View style={styles.prefRow}>
      <Text style={styles.prefLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={(v) => void onChange(v)}
        trackColor={{ true: paper.accent }}
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  prefLabel: {
    fontFamily: mono,
    fontSize: 12,
    letterSpacing: 1,
    color: paper.ink,
    flexShrink: 1,
  },
});
