import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { create } from 'zustand';

import { mono, paper } from '@/theme';

const TOAST_MS = 5000;

interface ToastState {
  message: string | null;
  actionLabel: string | null;
  onAction: (() => void) | null;
  show: (message: string, actionLabel?: string, onAction?: () => void) => void;
  dismiss: () => void;
}

export const useToast = create<ToastState>((set) => ({
  message: null,
  actionLabel: null,
  onAction: null,
  show: (message, actionLabel, onAction) =>
    set({ message, actionLabel: actionLabel ?? null, onAction: onAction ?? null }),
  dismiss: () => set({ message: null, actionLabel: null, onAction: null }),
}));

/** Bottom toast with optional action (e.g. UNDO). Mount once in the root layout. */
export function ToastHost() {
  const { message, actionLabel, onAction, dismiss } = useToast();

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(dismiss, TOAST_MS);
    return () => clearTimeout(t);
  }, [message, dismiss]);

  if (!message) return null;

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.toast} accessibilityLiveRegion="polite">
        <Text style={styles.text}>{message}</Text>
        {actionLabel ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              onAction?.();
              dismiss();
            }}
          >
            <Text style={styles.action}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 24, alignItems: 'center' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: paper.ink,
    borderRadius: 3,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '90%',
  },
  text: { fontFamily: mono, color: paper.card, fontSize: 13, flexShrink: 1 },
  action: {
    fontFamily: mono,
    color: paper.accent,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 1.5,
  },
});
