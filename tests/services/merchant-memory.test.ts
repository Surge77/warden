import { createCategoryRepository } from '@/services/category-repository';
import { createMerchantMemory, normalizeMerchant } from '@/services/merchant-memory';
import { makeTestDb } from '../helpers/test-db';

async function setup() {
  const db = makeTestDb();
  const cats = createCategoryRepository(db);
  const food = await cats.add('Food', '#EF4444');
  const travel = await cats.add('Travel', '#3B82F6');
  return { memory: createMerchantMemory(db), food, travel };
}

describe('normalizeMerchant', () => {
  it('lowercases, trims, and collapses inner whitespace', () => {
    expect(normalizeMerchant('  ZOMATO   Online  ')).toBe('zomato online');
  });
});

describe('MerchantMemory', () => {
  it('recalls a learned merchant category', async () => {
    const { memory, food } = await setup();
    await memory.learn('Zomato', food.id);
    expect(await memory.recall('zomato')).toBe(food.id);
  });

  it('matches case- and whitespace-insensitively', async () => {
    const { memory, food } = await setup();
    await memory.learn('  Cafe  Coffee Day ', food.id);
    expect(await memory.recall('CAFE COFFEE DAY')).toBe(food.id);
  });

  it('latest correction wins', async () => {
    const { memory, food, travel } = await setup();
    await memory.learn('Uber', food.id);
    await memory.learn('Uber', travel.id);
    expect(await memory.recall('Uber')).toBe(travel.id);
  });

  it('returns null for unknown merchants and ignores empty names', async () => {
    const { memory, food } = await setup();
    await memory.learn('   ', food.id);
    expect(await memory.recall('nowhere')).toBeNull();
    expect(await memory.recall('   ')).toBeNull();
  });
});
