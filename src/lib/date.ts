import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

const ISO_DATE = 'YYYY-MM-DD';
const MONTH_KEY = 'YYYY-MM';

// Receipt date formats seen in the wild, most-specific first.
const RECEIPT_DATE_FORMATS = [
  'DD/MM/YYYY',
  'DD-MM-YYYY',
  'DD.MM.YYYY',
  'D/M/YYYY',
  'YYYY-MM-DD',
  'DD/MM/YY',
  'DD-MM-YY',
  'D MMM YYYY',
  'DD MMM YYYY',
  'MMM DD, YYYY',
];

/** Parse a receipt date token into ISO yyyy-mm-dd, or null if unrecognized. */
export function parseReceiptDate(token: string): string | null {
  const trimmed = token.trim();
  for (const format of RECEIPT_DATE_FORMATS) {
    const parsed = dayjs(trimmed, format, true);
    if (parsed.isValid()) return parsed.format(ISO_DATE);
  }
  return null;
}

/** Epoch ms (UTC midnight) for an ISO yyyy-mm-dd date. */
export function isoDateToEpochMs(isoDate: string): number {
  return dayjs(isoDate, ISO_DATE, true).startOf('day').valueOf();
}

/** 'YYYY-MM' key for an epoch-ms timestamp. */
export function monthKey(epochMs: number): string {
  return dayjs(epochMs).format(MONTH_KEY);
}

/** Inclusive start / exclusive end epoch-ms bounds for a 'YYYY-MM' month. */
export function monthRange(month: string): { start: number; end: number } {
  const start = dayjs(month, MONTH_KEY, true).startOf('month');
  return { start: start.valueOf(), end: start.add(1, 'month').valueOf() };
}

export function todayIso(): string {
  return dayjs().format(ISO_DATE);
}

/**
 * Last `count` month keys in 'YYYY-MM', descending (most recent first),
 * ending at the month containing `fromEpochMs` (default now).
 */
export function recentMonths(count: number, fromEpochMs?: number): string[] {
  const end = fromEpochMs === undefined ? dayjs() : dayjs(fromEpochMs);
  const months: string[] = [];
  for (let i = 0; i < count; i += 1) {
    months.push(end.subtract(i, 'month').format(MONTH_KEY));
  }
  return months;
}
