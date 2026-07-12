import { FREE_ITEM_LIMIT, canAddItem } from '@/lib/pro';

describe('canAddItem', () => {
  it('allows free users below the limit', () => {
    expect(canAddItem(0, false)).toBe(true);
    expect(canAddItem(FREE_ITEM_LIMIT - 1, false)).toBe(true);
  });

  it('blocks free users at the limit', () => {
    expect(canAddItem(FREE_ITEM_LIMIT, false)).toBe(false);
    expect(canAddItem(FREE_ITEM_LIMIT + 10, false)).toBe(false);
  });

  it('never blocks pro users', () => {
    expect(canAddItem(FREE_ITEM_LIMIT, true)).toBe(true);
    expect(canAddItem(10_000, true)).toBe(true);
  });
});
