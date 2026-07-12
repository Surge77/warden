import { reminderContent } from '@/services/item-reminders';

jest.mock('expo-notifications', () => ({}), { virtual: true });

describe('reminderContent', () => {
  it('names the item in every kind', () => {
    expect(reminderContent('return', 'Headphones').body).toContain('Headphones');
    expect(reminderContent('nudge', 'Headphones').body).toContain('Headphones');
    expect(reminderContent('expiry', 'Headphones').body).toContain('Headphones');
  });

  it('falls back to a generic name when item is unnamed', () => {
    expect(reminderContent('return', null).body).toContain('your item');
  });

  it('distinct titles per kind', () => {
    const titles = (['return', 'nudge', 'expiry'] as const).map(
      (k) => reminderContent(k, null).title,
    );
    expect(new Set(titles).size).toBe(3);
  });
});
