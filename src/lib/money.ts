const MINOR_UNITS_PER_RUPEE = 100;

/** Convert a rupee value (e.g. 249.50) to integer paise (24950). */
export function rupeesToMinor(rupees: number): number {
  return Math.round(rupees * MINOR_UNITS_PER_RUPEE);
}

/** Convert integer paise (24950) back to rupees (249.5). */
export function minorToRupees(minor: number): number {
  return minor / MINOR_UNITS_PER_RUPEE;
}

/**
 * Parse a free-text amount ("₹ 1,249.50", "1249", "Rs.99") to integer paise.
 * Returns null when no plausible number is present.
 */
export function parseAmountToMinor(input: string): number | null {
  // Strip currency tokens first so the dot in "Rs.99" isn't read as a decimal.
  const stripped = input.replace(/(?:rs\.?|inr|₹)/gi, '');
  const cleaned = stripped.replace(/[^0-9.]/g, ''); // comma = INR thousands sep → drop
  if (cleaned.length === 0) return null;

  const normalized = normalizeDecimal(cleaned);
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return null;
  return rupeesToMinor(value);
}

// Commas are already removed (INR thousands separator). Keep only the last dot
// as the decimal point; collapse any earlier dots (rare OCR noise).
function normalizeDecimal(cleaned: string): string {
  const lastDot = cleaned.lastIndexOf('.');
  if (lastDot === -1) return cleaned;
  const intPart = cleaned.slice(0, lastDot).replace(/\./g, '');
  const fracPart = cleaned.slice(lastDot + 1);
  return `${intPart}.${fracPart}`;
}

/** Format integer paise as a display string, e.g. 24950 → "₹249.50". */
export function formatINR(minor: number): string {
  const rupees = minorToRupees(minor);
  return `₹${rupees.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
