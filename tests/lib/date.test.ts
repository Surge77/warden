import {
  isoDateToEpochMs,
  monthKey,
  monthRange,
  parseReceiptDate,
  recentMonths,
} from '@/lib/date';

describe('date', () => {
  it.each([
    ['12/05/2024', '2024-05-12'],
    ['15-04-2024', '2024-04-15'],
    ['01.02.2024', '2024-02-01'],
    ['2024-12-01', '2024-12-01'],
    ['05 Jan 2024', '2024-01-05'],
  ])('parses receipt date "%s" → %s', (input, expected) => {
    expect(parseReceiptDate(input)).toBe(expected);
  });

  it('returns null for unrecognized date text', () => {
    expect(parseReceiptDate('not a date')).toBeNull();
  });

  it('round-trips ISO date to epoch ms and back to month key', () => {
    const ms = isoDateToEpochMs('2024-05-12');
    expect(monthKey(ms)).toBe('2024-05');
  });

  it('computes an inclusive/exclusive month range', () => {
    const { start, end } = monthRange('2024-02');
    expect(monthKey(start)).toBe('2024-02');
    expect(end).toBeGreaterThan(start);
    expect(monthKey(end)).toBe('2024-03');
  });

  describe('recentMonths', () => {
    const may2024 = isoDateToEpochMs('2024-05-20');

    it('returns the requested number of items', () => {
      expect(recentMonths(6, may2024)).toHaveLength(6);
    });

    it('starts with the current month', () => {
      expect(recentMonths(6, may2024)[0]).toBe('2024-05');
    });

    it('has the previous month as the second item', () => {
      expect(recentMonths(6, may2024)[1]).toBe('2024-04');
    });

    it('handles the year boundary', () => {
      const jan2024 = isoDateToEpochMs('2024-01-10');
      const months = recentMonths(3, jan2024);
      expect(months[0]).toBe('2024-01');
      expect(months[1]).toBe('2023-12');
      expect(months[2]).toBe('2023-11');
    });
  });
});
