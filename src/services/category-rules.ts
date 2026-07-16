export const DEFAULT_CATEGORIES = [
  { name: 'Food', color: '#E0552E' },
  { name: 'Groceries', color: '#8CBB94' },
  { name: 'Transport', color: '#7DA7D9' },
  { name: 'Shopping', color: '#B08BC9' },
  { name: 'Health', color: '#5FB0A5' },
  { name: 'Bills', color: '#C9A96A' },
  { name: 'Entertainment', color: '#D98BA6' },
  { name: 'Other', color: '#8FA391' },
] as const;

export const FALLBACK_CATEGORY = 'Other';

// Ordered keyword → category rules. First match wins, so put specific brands
// before generic words. All matching is case-insensitive on the merchant text.
const RULES: readonly { category: string; keywords: readonly string[] }[] = [
  {
    category: 'Food',
    keywords: ['swiggy', 'zomato', 'restaurant', 'cafe', 'pizza', 'kfc', 'mcdonald', 'dominos', 'hotel', 'bakery', 'biryani', 'food'],
  },
  {
    category: 'Groceries',
    keywords: ['bigbasket', 'blinkit', 'zepto', 'dmart', 'grocery', 'supermarket', 'kirana', 'mart', 'fresh', 'reliance smart'],
  },
  {
    category: 'Transport',
    keywords: ['uber', 'ola', 'rapido', 'petrol', 'fuel', 'hp ', 'indian oil', 'bharat petroleum', 'metro', 'irctc', 'redbus', 'parking'],
  },
  {
    category: 'Shopping',
    keywords: ['amazon', 'flipkart', 'myntra', 'ajio', 'meesho', 'mall', 'lifestyle', 'westside', 'store'],
  },
  {
    category: 'Health',
    keywords: ['pharmacy', 'apollo', 'medplus', 'hospital', 'clinic', 'medical', 'chemist', 'pharma'],
  },
  {
    category: 'Bills',
    keywords: ['electricity', 'recharge', 'jio', 'airtel', 'vi ', 'broadband', 'gas', 'water bill', 'dth', 'bill'],
  },
  {
    category: 'Entertainment',
    keywords: ['bookmyshow', 'pvr', 'inox', 'netflix', 'spotify', 'cinema', 'movie', 'gaming'],
  },
];

/**
 * Map a merchant name to a category by keyword rules. Pure — no DB, no I/O.
 * Returns FALLBACK_CATEGORY when nothing matches or merchant is empty.
 */
export function categorize(merchant: string | null): string {
  if (!merchant) return FALLBACK_CATEGORY;
  const haystack = merchant.toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some((kw) => haystack.includes(kw))) {
      return rule.category;
    }
  }
  return FALLBACK_CATEGORY;
}
