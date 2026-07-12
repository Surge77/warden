import { parseAmountToMinor } from '@/lib/money';
import { parseReceiptDate } from '@/lib/date';
import type { ParsedReceipt } from '@/types';

// Total-line keywords, highest signal first. Earlier = higher confidence.
const AMOUNT_KEYWORDS = [
  'grand total',
  'total amount',
  'net amount',
  'net payable',
  'amount payable',
  'total payable',
  'total',
  'amount',
  'balance',
  'net',
];

// Lines that are clearly not the merchant name.
const MERCHANT_STOPWORDS = [
  'invoice',
  'receipt',
  'gst',
  'gstin',
  'tax',
  'bill no',
  'bill no.',
  'date',
  'time',
  'tel',
  'phone',
  'cashier',
  'order',
  'table',
  'total',
  'subtotal',
  'amount',
  'balance',
  'net',
  'qty',
  'item',
  'hsn',
  'mrp',
];

const CURRENCY_NUMBER = /(?:₹|rs\.?|inr)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i;
const DECIMAL_NUMBER = /([0-9][0-9,]*\.[0-9]{1,2})/;
const DATE_CANDIDATE = /\b(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}|\d{4}-\d{2}-\d{2}|\d{1,2}\s+[A-Za-z]{3,}\s+\d{4}|[A-Za-z]{3,}\s+\d{1,2},?\s+\d{4})\b/;

export function parse(rawText: string): ParsedReceipt {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const amount = extractAmount(lines);
  const date = extractDate(rawText);
  const merchant = extractMerchant(lines);

  return {
    amountMinor: amount.value,
    date: date.value,
    merchant: merchant.value,
    confidence: {
      amount: amount.confidence,
      date: date.confidence,
      merchant: merchant.confidence,
    },
  };
}

function extractAmount(lines: string[]): { value: number | null; confidence: number } {
  let best: { value: number; priority: number } | null = null;

  for (const line of lines) {
    if (DATE_CANDIDATE.test(line)) continue; // never read a date as money
    const lower = line.toLowerCase();
    const priority = AMOUNT_KEYWORDS.findIndex((kw) => lower.includes(kw));
    if (priority === -1) continue;

    const value = lastAmountOnLine(line);
    if (value === null) continue;
    if (!best || priority < best.priority) best = { value, priority };
  }

  if (best) {
    // Top-tier keyword (grand total / total amount) → high confidence.
    return { value: best.value, confidence: best.priority <= 1 ? 0.95 : 0.85 };
  }

  const fallback = largestCurrencyAmount(lines);
  if (fallback !== null) return { value: fallback, confidence: 0.5 };
  return { value: null, confidence: 0 };
}

function lastAmountOnLine(line: string): number | null {
  const currency = matchAll(line, new RegExp(CURRENCY_NUMBER, 'gi'));
  if (currency.length > 0) return parseAmountToMinor(currency[currency.length - 1]!);
  const decimal = matchAll(line, new RegExp(DECIMAL_NUMBER, 'g'));
  if (decimal.length > 0) return parseAmountToMinor(decimal[decimal.length - 1]!);
  return null;
}

function largestCurrencyAmount(lines: string[]): number | null {
  let max: number | null = null;
  for (const line of lines) {
    if (DATE_CANDIDATE.test(line)) continue;
    const candidates = [
      ...matchAll(line, new RegExp(CURRENCY_NUMBER, 'gi')),
      ...matchAll(line, new RegExp(DECIMAL_NUMBER, 'g')),
    ];
    for (const c of candidates) {
      const minor = parseAmountToMinor(c);
      if (minor !== null && (max === null || minor > max)) max = minor;
    }
  }
  return max;
}

function extractDate(rawText: string): { value: string | null; confidence: number } {
  const match = rawText.match(new RegExp(DATE_CANDIDATE, 'g'));
  if (match) {
    for (const candidate of match) {
      const iso = parseReceiptDate(candidate);
      if (iso) return { value: iso, confidence: 0.8 };
    }
  }
  return { value: null, confidence: 0 };
}

function extractMerchant(lines: string[]): { value: string | null; confidence: number } {
  for (const line of lines.slice(0, 5)) {
    const lower = line.toLowerCase();
    if (MERCHANT_STOPWORDS.some((sw) => startsWithLabel(lower, sw))) continue;
    if (DATE_CANDIDATE.test(line)) continue;
    if (!/[a-z]{2,}/i.test(line)) continue; // needs real letters
    if (/^\d/.test(line)) continue; // skip lines starting with digits (addresses)
    return { value: line, confidence: 0.6 };
  }
  return { value: null, confidence: 0 };
}

// True when `lower` begins with stopword `sw` as a label, not merely a prefix of
// a longer word. Guards real merchants like "PhonePe" against the "phone" stopword
// while still catching "Phone: 123" / "Bill No 12".
function startsWithLabel(lower: string, sw: string): boolean {
  if (!lower.startsWith(sw)) return false;
  const next = lower.charAt(sw.length);
  return next === '' || !/[a-z]/.test(next);
}

// Extract the captured group of every match (RN/Hermes-safe, no matchAll dep).
function matchAll(input: string, re: RegExp): string[] {
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(input)) !== null) {
    out.push(m[1] ?? m[0]);
    if (m.index === re.lastIndex) re.lastIndex++;
  }
  return out;
}
