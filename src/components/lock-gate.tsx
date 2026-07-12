import * as LocalAuthentication from 'expo-local-authentication';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { db } from '@/db/client';
import { createSettingsRepository, SETTING_KEYS } from '@/services/settings-repository';
import { mono, paper } from '@/theme';

const settingsRepo = createSettingsRepository(db);

type LockState = 'checking' | 'locked' | 'open';

/** Biometric gate. Renders children only after unlock (or when the lock setting is off). */
export function LockGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LockState>('checking');

  const tryUnlock = useCallback(async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Warden',
    }).catch(() => ({ success: false }) as const);
    setState(result.success ? 'open' : 'locked');
  }, []);

  useEffect(() => {
    void settingsRepo
      .getBool(SETTING_KEYS.appLock)
      .then(async (enabled) => {
        if (!enabled) {
          setState('open');
          return;
        }
        const capable = await LocalAuthentication.hasHardwareAsync();
        const enrolled = capable && (await LocalAuthentication.isEnrolledAsync());
        if (!enrolled) {
          setState('open'); // no biometrics on device — never lock the user out
          return;
        }
        void tryUnlock();
      })
      .catch(() => setState('open'));
  }, [tryUnlock]);

  if (state === 'open') return <>{children}</>;

  return (
    <View style={styles.center}>
      <Text style={styles.title}>WARDEN LOCKED</Text>
      {state === 'locked' ? (
        <Pressable style={styles.button} onPress={() => void tryUnlock()} accessibilityRole="button">
          <Text style={styles.buttonText}>UNLOCK</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: paper.bg,
  },
  title: { fontFamily: mono, fontSize: 15, fontWeight: '700', letterSpacing: 2, color: paper.ink },
  button: {
    backgroundColor: paper.ink,
    borderRadius: 3,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  buttonText: { fontFamily: mono, color: paper.card, fontWeight: '700', letterSpacing: 2 },
});
