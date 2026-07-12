/** Items a free-tier user can track before the Pro unlock is required. */
export const FREE_ITEM_LIMIT = 5;

/** Gate for adding a new item. Editing/deleting existing items is never gated. */
export function canAddItem(currentCount: number, isPro: boolean): boolean {
  return isPro || currentCount < FREE_ITEM_LIMIT;
}
