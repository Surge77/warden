export const DEFAULT_CATEGORIES = [
  { name: 'Food', color: '#EF4444' },
  { name: 'Groceries', color: '#22C55E' },
  { name: 'Transport', color: '#3B82F6' },
  { name: 'Shopping', color: '#A855F7' },
  { name: 'Health', color: '#14B8A6' },
  { name: 'Bills', color: '#F59E0B' },
  { name: 'Entertainment', color: '#EC4899' },
  { name: 'Other', color: '#6B7280' },
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
