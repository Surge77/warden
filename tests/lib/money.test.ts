import { formatINR, minorToRupees, parseAmountToMinor, rupeesToMinor } from '@/lib/money';

describe('money', () => {
  it('converts rupees to minor units (paise)', () => {
    expect(rupeesToMinor(249.5)).toBe(24950);
    expect(rupeesToMinor(100)).toBe(10000);
  });

  it('rounds to avoid float drift', () => {
    expect(rupeesToMinor(0.1 + 0.2)).toBe(30);
  });

  it('converts minor units back to rupees', () => {
    expect(minorToRupees(24950)).toBe(249.5);
  });

  it.each([
    ['₹ 1,249.50', 124950],
    ['Rs.99', 9900],
    ['1249', 124900],
    ['1,00,000', 10000000],
    ['12.5', 1250],
  ])('parses "%s" → %d paise', (input, expected) => {
    expect(parseAmountToMinor(input)).toBe(expected);
  });

  it('returns null when no number is present', () => {
    expect(parseAmountToMinor('abc')).toBeNull();
    expect(parseAmountToMinor('')).toBeNull();
  });

  it('formats minor units as INR', () => {
    const formatted = formatINR(24950);
    expect(formatted).toContain('₹');
    expect(formatted).toContain('249.50');
  });
});
