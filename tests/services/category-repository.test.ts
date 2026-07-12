import { createCategoryRepository } from '@/services/category-repository';
import { makeTestDb } from '../helpers/test-db';

function makeRepo() {
  const db = makeTestDb();
  return { repo: createCategoryRepository(db), db };
}

describe('CategoryRepository', () => {
  it('adds a category then lists it back', async () => {
    const { repo } = makeRepo();
    const created = await repo.add('Food', '#EF4444');
    expect(created.id).toBeGreaterThan(0);
    expect(created.name).toBe('Food');
    expect(created.color).toBe('#EF4444');

    const list = await repo.list();
    expect(list.map((c) => c.name)).toEqual(['Food']);
  });

  it('does not create a second row for a duplicate name', async () => {
    const { repo } = makeRepo();
    const first = await repo.add('Food', '#EF4444');
    const second = await repo.add('Food', '#22C55E');
    expect(second.id).toBe(first.id);
    expect(await repo.list()).toHaveLength(1);
  });

  it('treats a name differing only by surrounding whitespace as a duplicate', async () => {
    const { repo } = makeRepo();
    const first = await repo.add('Food', '#EF4444');
    const second = await repo.add('  Food  ', '#22C55E');
    expect(second.id).toBe(first.id);
    expect(await repo.list()).toHaveLength(1);
  });

  it('trims the name before storing it', async () => {
    const { repo } = makeRepo();
    const created = await repo.add('  Travel  ', '#3B82F6');
    expect(created.name).toBe('Travel');
  });

  it('rejects an empty name', async () => {
    const { repo } = makeRepo();
    await expect(repo.add('', '#EF4444')).rejects.toThrow();
  });

  it('rejects a whitespace-only name', async () => {
    const { repo } = makeRepo();
    await expect(repo.add('   ', '#EF4444')).rejects.toThrow();
  });

  it('lists categories ordered by name', async () => {
    const { repo } = makeRepo();
    await repo.add('Transport', '#3B82F6');
    await repo.add('Bills', '#F59E0B');
    await repo.add('Food', '#EF4444');
    expect((await repo.list()).map((c) => c.name)).toEqual(['Bills', 'Food', 'Transport']);
  });

  it('returns an empty list when no categories exist', async () => {
    const { repo } = makeRepo();
    expect(await repo.list()).toEqual([]);
  });
});
