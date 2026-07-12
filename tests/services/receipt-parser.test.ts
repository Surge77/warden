import { parse } from '@/services/receipt-parser';
import { RECEIPT_FIXTURES } from '../fixtures/receipts';

// Minimum acceptable amount-extraction accuracy. Raise this as the parser improves.
const AMOUNT_ACCURACY_TARGET = 0.85;

describe('ReceiptParser — accuracy on labeled fixtures', () => {
  it(`extracts the correct amount on >= ${AMOUNT_ACCURACY_TARGET * 100}% of receipts`, () => {
    const correct = RECEIPT_FIXTURES.filter(
      (f) => parse(f.raw).amountMinor === f.expected.amountMinor,
    ).length;
    const accuracy = correct / RECEIPT_FIXTURES.length;
    // Surfaced in CI logs as the résumé metric.
    // eslint-disable-next-line no-console
    console.log(`Amount accuracy: ${(accuracy * 100).toFixed(1)}% (${correct}/${RECEIPT_FIXTURES.length})`);
    expect(accuracy).toBeGreaterThanOrEqual(AMOUNT_ACCURACY_TARGET);
  });

  it('extracts the correct date on >= 85% of receipts', () => {
    const correct = RECEIPT_FIXTURES.filter((f) => parse(f.raw).date === f.expected.date).length;
    expect(correct / RECEIPT_FIXTURES.length).toBeGreaterThanOrEqual(0.85);
  });

  it('extracts the correct merchant on >= 80% of receipts', () => {
    const correct = RECEIPT_FIXTURES.filter(
      (f) => parse(f.raw).merchant === f.expected.merchant,
    ).length;
    expect(correct / RECEIPT_FIXTURES.length).toBeGreaterThanOrEqual(0.8);
  });
});

describe('ReceiptParser — field behavior', () => {
  it('prefers a grand-total line and reports high confidence', () => {
    const r = parse('Shop\nSubtotal 100.00\nGrand Total 118.00\n01/01/2024');
    expect(r.amountMinor).toBe(11800);
    expect(r.confidence.amount).toBeGreaterThanOrEqual(0.9);
  });

  it('uses a generic total keyword with lower confidence', () => {
    const r = parse('Shop\nBalance 50.00');
    expect(r.amountMinor).toBe(5000);
    expect(r.confidence.amount).toBeLessThan(0.9);
    expect(r.confidence.amount).toBeGreaterThan(0.5);
  });

  it('falls back to the largest currency amount when no keyword present', () => {
    const r = parse('Kirana Store\n20.00\n340.00\n5.00');
    expect(r.amountMinor).toBe(34000);
    expect(r.confidence.amount).toBe(0.5);
  });

  it('returns null amount when no numbers exist', () => {
    const r = parse('Just some words\nno digits here');
    expect(r.amountMinor).toBeNull();
    expect(r.confidence.amount).toBe(0);
  });

  it('never reads a date as the amount', () => {
    const r = parse('Store\nTotal 250.00\n12/05/2024');
    expect(r.amountMinor).toBe(25000);
  });

  it('returns null date when none is present', () => {
    const r = parse('Store\nTotal 250.00');
    expect(r.date).toBeNull();
    expect(r.confidence.date).toBe(0);
  });

  it('skips stopword and numeric lines when picking a merchant', () => {
    const r = parse('Invoice No 12\n12 Main Road\nTea Stall\nTotal 30.00');
    expect(r.merchant).toBe('Tea Stall');
  });

  it('returns null merchant when no plausible name line exists', () => {
    const r = parse('123456\nGSTIN 27ABC\nTotal 10.00');
    expect(r.merchant).toBeNull();
    expect(r.confidence.merchant).toBe(0);
  });

  it('ignores a total keyword line that carries no number', () => {
    const r = parse('Grand Total\n12/01/2024');
    expect(r.amountMinor).toBeNull();
    expect(r.confidence.amount).toBe(0);
  });

  it('reads the last currency amount on a line', () => {
    const r = parse('Total was ₹10.00 now ₹99.00');
    expect(r.amountMinor).toBe(9900);
  });
});

describe('warranty hint extraction', () => {
  it('detects "1 YEAR WARRANTY"', () => {
    expect(parse('Croma Electronics\nHeadphones 2999.00\n1 YEAR WARRANTY\nTOTAL 2999.00').warrantyMonths).toBe(12);
  });

  it('detects "WARRANTY: 12 MONTHS"', () => {
    expect(parse('Store\nWARRANTY: 12 MONTHS\nTOTAL 500.00').warrantyMonths).toBe(12);
  });

  it('detects "2 YR WARRANTY" shorthand', () => {
    expect(parse('Store\n2 YR WARRANTY\nTOTAL 500.00').warrantyMonths).toBe(24);
  });

  it('detects "6 MONTH WARRANTY" singular', () => {
    expect(parse('Store\n6 MONTH WARRANTY on parts\nTOTAL 500.00').warrantyMonths).toBe(6);
  });

  it('detects "GUARANTEE 1 YEAR" wording', () => {
    expect(parse('Store\nGUARANTEE 1 YEAR\nTOTAL 500.00').warrantyMonths).toBe(12);
  });

  it('returns null when no warranty text present', () => {
    expect(parse('Store\nMilk 28.00\nTOTAL 28.00').warrantyMonths).toBeNull();
  });

  it('ignores implausible spans like "99 YEAR WARRANTY"', () => {
    expect(parse('Store\n99 YEAR WARRANTY\nTOTAL 500.00').warrantyMonths).toBeNull();
  });
});
