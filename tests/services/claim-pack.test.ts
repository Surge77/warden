import { buildClaimHtml } from '@/services/claim-pack';
import type { Expense } from '@/types';

jest.mock('expo-file-system', () => ({}), { virtual: true });
jest.mock('expo-sharing', () => ({}), { virtual: true });

const expense = (overrides: Partial<Expense> = {}): Expense => ({
  id: 7,
  amountMinor: 299900,
  currency: 'INR',
  merchant: 'Croma',
  categoryId: null,
  spentAt: Date.UTC(2026, 0, 15),
  note: null,
  imageUri: null,
  rawOcrText: null,
  itemName: 'Headphones',
  returnWindowDays: 30,
  warrantyMonths: 12,
  createdAt: 0,
  ...overrides,
});

describe('buildClaimHtml', () => {
  it('includes item, merchant, amount and warranty-until date', () => {
    const html = buildClaimHtml(expense(), null);
    expect(html).toContain('Headphones');
    expect(html).toContain('Croma');
    expect(html).toContain('12 months');
    expect(html).toContain('2027'); // warranty valid until Jan 2027
  });

  it('embeds the receipt image when provided', () => {
    const html = buildClaimHtml(expense(), 'QUJD');
    expect(html).toContain('data:image/jpeg;base64,QUJD');
  });

  it('states when no image is attached', () => {
    expect(buildClaimHtml(expense(), null)).toContain('No receipt image');
  });

  it('escapes HTML in user-controlled fields', () => {
    const html = buildClaimHtml(expense({ itemName: '<script>x</script>' }), null);
    expect(html).not.toContain('<script>x</script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
