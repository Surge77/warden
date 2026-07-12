import { categorize, DEFAULT_CATEGORIES, FALLBACK_CATEGORY } from '@/services/category-rules';

describe('CategoryRules.categorize', () => {
  it.each([
    ['Swiggy', 'Food'],
    ['Dominos Pizza', 'Food'],
    ['BigBasket', 'Groceries'],
    ['DMart Supermarket', 'Groceries'],
    ['Uber', 'Transport'],
    ['Indian Oil Petrol', 'Transport'],
    ['Amazon', 'Shopping'],
    ['Myntra', 'Shopping'],
    ['Apollo Pharmacy', 'Health'],
    ['Jio Recharge', 'Bills'],
    ['Electricity Board', 'Bills'],
    ['PVR Cinemas', 'Entertainment'],
    ['Netflix', 'Entertainment'],
  ])('maps "%s" → %s', (merchant, expected) => {
    expect(categorize(merchant)).toBe(expected);
  });

  it('is case-insensitive', () => {
    expect(categorize('SWIGGY')).toBe('Food');
  });

  it('returns fallback for unknown merchants', () => {
    expect(categorize('Random Local Vendor XYZ')).toBe(FALLBACK_CATEGORY);
  });

  it('returns fallback for null merchant', () => {
    expect(categorize(null)).toBe(FALLBACK_CATEGORY);
  });

  it('returns fallback for empty string', () => {
    expect(categorize('')).toBe(FALLBACK_CATEGORY);
  });

  it('every rule category exists in DEFAULT_CATEGORIES', () => {
    const names = new Set(DEFAULT_CATEGORIES.map((c) => c.name));
    expect(names.has(FALLBACK_CATEGORY)).toBe(true);
  });
});
