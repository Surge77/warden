import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const FILE_NAME = 'warden-items.csv';
const MIME_TYPE = 'text/csv';

/** Write the CSV to the cache dir and open the system share sheet. No-op if sharing is unavailable. */
export async function exportExpensesCsv(csv: string): Promise<void> {
  const file = new File(Paths.cache, FILE_NAME);
  file.create({ overwrite: true });
  file.write(csv);

  if (!(await Sharing.isAvailableAsync())) return;

  await Sharing.shareAsync(file.uri, {
    mimeType: MIME_TYPE,
    dialogTitle: 'Export expenses',
  });
}
