import { createSettingsRepository, SETTING_KEYS } from '@/services/settings-repository';
import { makeTestDb } from '../helpers/test-db';

describe('SettingsRepository', () => {
  it('returns null for unset keys and false for unset bools', async () => {
    const repo = createSettingsRepository(makeTestDb());
    expect(await repo.get('missing')).toBeNull();
    expect(await repo.getBool(SETTING_KEYS.appLock)).toBe(false);
  });

  it('sets and reads back a value, overwriting on repeat', async () => {
    const repo = createSettingsRepository(makeTestDb());
    await repo.set('k', 'a');
    await repo.set('k', 'b');
    expect(await repo.get('k')).toBe('b');
  });

  it('round-trips booleans', async () => {
    const repo = createSettingsRepository(makeTestDb());
    await repo.setBool(SETTING_KEYS.dailyReminder, true);
    expect(await repo.getBool(SETTING_KEYS.dailyReminder)).toBe(true);
    await repo.setBool(SETTING_KEYS.dailyReminder, false);
    expect(await repo.getBool(SETTING_KEYS.dailyReminder)).toBe(false);
  });
});
