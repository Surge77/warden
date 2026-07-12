import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { LockGate } from '@/components/lock-gate';
import { ToastHost } from '@/components/toast';
import { useDatabaseSetup } from '@/db/use-database-setup';
import { mono, paper } from '@/theme';

// Expo Router renders this for any uncaught error in the route tree below.
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={styles.center}>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorBody}>{error.message}</Text>
      <Pressable style={styles.retry} onPress={retry} accessibilityRole="button">
        <Text style={styles.retryText}>Try again</Text>
      </Pressable>
    </View>
  );
}

export default function RootLayout() {
  const { ready, error } = useDatabaseSetup();

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Could not open the database</Text>
        <Text style={styles.errorBody}>Please restart the app.</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <LockGate>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: paper.bg },
          headerShadowVisible: false,
          headerTintColor: paper.ink,
          headerTitleStyle: { fontFamily: mono, fontWeight: '700', fontSize: 15 },
          contentStyle: { backgroundColor: paper.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'RECEIPTLY' }} />
        <Stack.Screen name="quick-add" options={{ title: 'QUICK ADD' }} />
        <Stack.Screen name="capture" options={{ title: 'CAPTURE' }} />
        <Stack.Screen name="review" options={{ title: 'REVIEW' }} />
        <Stack.Screen name="history" options={{ title: 'HISTORY' }} />
        <Stack.Screen name="settings" options={{ title: 'SETUP' }} />
        <Stack.Screen name="expense/[id]" options={{ title: 'EXPENSE' }} />
        <Stack.Screen name="edit/[id]" options={{ title: 'EDIT' }} />
      </Stack>
      <ToastHost />
    </LockGate>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: paper.bg,
  },
  errorTitle: {
    fontFamily: mono,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    color: paper.ink,
  },
  errorBody: { fontFamily: mono, color: paper.inkFaded, textAlign: 'center' },
  retry: {
    marginTop: 16,
    backgroundColor: paper.ink,
    borderRadius: 3,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryText: { fontFamily: mono, color: paper.card, fontWeight: '700', letterSpacing: 2 },
});
