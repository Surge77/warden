import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

// Cap the longest edge so OCR runs fast and stored images stay small.
export const MAX_EDGE_PX = 1600;
const JPEG_QUALITY = 0.7;

/**
 * Re-encode a captured photo as JPEG (quality 0.7), downscaling so its longest
 * edge is <= MAX_EDGE_PX. Photos already within the limit are not resized but
 * are still normalized to JPEG. Returns the new file URI.
 */
export async function compressForOcr(uri: string, width: number, height: number): Promise<string> {
  const longest = Math.max(width, height);
  const context = ImageManipulator.manipulate(uri);

  if (longest > MAX_EDGE_PX) {
    const scale = MAX_EDGE_PX / longest;
    context.resize({ width: Math.round(width * scale), height: Math.round(height * scale) });
  }

  const image = await context.renderAsync();
  const result = await image.saveAsync({ format: SaveFormat.JPEG, compress: JPEG_QUALITY });
  return result.uri;
}
