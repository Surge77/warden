import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { compressForOcr } from '@/services/image';
import { mlKitOcrService } from '@/services/ocr-service';
import { mono, paper } from '@/theme';

export default function CaptureScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) return <Centered>{<ActivityIndicator />}</Centered>;

  if (!permission.granted) {
    return (
      <Centered>
        <Text style={styles.message}>Camera access is needed to photograph receipts.</Text>
        <Pressable style={styles.button} onPress={requestPermission} accessibilityRole="button">
          <Text style={styles.buttonText}>Grant permission</Text>
        </Pressable>
      </Centered>
    );
  }

  async function processImage(uri: string, width: number, height: number) {
    const imageUri = await compressForOcr(uri, width, height).catch(() => uri);
    const rawText = await mlKitOcrService.recognize(imageUri).catch((e: unknown) => {
      if (__DEV__) console.warn('OCR failed; continuing with manual entry', e);
      return '';
    });
    router.replace({ pathname: '/review', params: { imageUri, rawText } });
  }

  async function onCapture() {
    if (!cameraRef.current || busy) return;
    setBusy(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (!photo) return;
      await processImage(photo.uri, photo.width, photo.height);
    } finally {
      setBusy(false);
    }
  }

  async function onPickFromGallery() {
    if (busy) return;
    setBusy(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
      });
      const asset = result.canceled ? undefined : result.assets[0];
      if (!asset) return;
      await processImage(asset.uri, asset.width, asset.height);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />
      <Pressable
        style={[styles.button, busy && styles.buttonDisabled]}
        onPress={onCapture}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel="Capture receipt"
      >
        <Text style={styles.buttonText}>{busy ? 'Reading…' : 'Capture'}</Text>
      </Pressable>
      <Pressable
        style={[styles.button, styles.buttonSecondary, busy && styles.buttonDisabled]}
        onPress={onPickFromGallery}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel="Pick receipt from gallery"
      >
        <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Pick from gallery</Text>
      </Pressable>
    </View>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <View style={styles.centered}>{children}</View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: paper.bg },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
    backgroundColor: paper.bg,
  },
  camera: { flex: 1 },
  message: { fontFamily: mono, textAlign: 'center', fontSize: 14, color: paper.ink },
  button: {
    backgroundColor: paper.accent,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 3,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonSecondary: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: paper.inkFaint, marginBottom: 16 },
  buttonDisabled: { opacity: 0.5 },
  buttonTextSecondary: { color: paper.ink },
  buttonText: {
    fontFamily: mono,
    color: paper.bg,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
