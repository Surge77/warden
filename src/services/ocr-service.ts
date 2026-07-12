import TextRecognition from '@react-native-ml-kit/text-recognition';

export interface OcrService {
  recognize(imageUri: string): Promise<string>;
}

/**
 * On-device OCR via ML Kit. Runs fully offline; the image never leaves the
 * device. Returns the recognized text block (newline-separated lines).
 */
export const mlKitOcrService: OcrService = {
  async recognize(imageUri: string): Promise<string> {
    const result = await TextRecognition.recognize(imageUri);
    return result.text;
  },
};
