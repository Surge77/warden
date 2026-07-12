import {
  EXPIRY_LEAD_DAYS,
  NUDGE_LEAD_DAYS,
  RETURN_LEAD_DAYS,
  planReminders,
  returnDeadlineMs,
  warrantyExpiryMs,
} from '../../src/lib/warranty';

const DAY_MS = 24 * 60 * 60 * 1000;
// 2026-01-15 00:00 UTC — fixed anchor so tests are deterministic.
const PURCHASE = Date.UTC(2026, 0, 15);

describe('returnDeadlineMs', () => {
  it('returns purchase date + window days', () => {
    expect(returnDeadlineMs({ purchaseDateMs: PURCHASE, returnWindowDays: 30 })).toBe(
      PURCHASE + 30 * DAY_MS,
    );
  });

  it('returns null when no return window set', () => {
    expect(returnDeadlineMs({ purchaseDateMs: PURCHASE })).toBeNull();
    expect(returnDeadlineMs({ purchaseDateMs: PURCHASE, returnWindowDays: null })).toBeNull();
    expect(returnDeadlineMs({ purchaseDateMs: PURCHASE, returnWindowDays: 0 })).toBeNull();
  });
});

describe('warrantyExpiryMs', () => {
  it('adds calendar months, not fixed 30-day blocks', () => {
    // 2026-01-15 + 1 month = 2026-02-15 (31 days later, not 30)
    expect(warrantyExpiryMs({ purchaseDateMs: PURCHASE, warrantyMonths: 1 })).toBe(
      Date.UTC(2026, 1, 15),
    );
  });

  it('handles 12-month warranties across the year boundary', () => {
    expect(warrantyExpiryMs({ purchaseDateMs: PURCHASE, warrantyMonths: 12 })).toBe(
      Date.UTC(2027, 0, 15),
    );
  });

  it('clamps month-end overflow (Jan 31 + 1 month → Feb 28)', () => {
    const jan31 = Date.UTC(2026, 0, 31);
    expect(warrantyExpiryMs({ purchaseDateMs: jan31, warrantyMonths: 1 })).toBe(
      Date.UTC(2026, 1, 28),
    );
  });

  it('returns null when no warranty set', () => {
    expect(warrantyExpiryMs({ purchaseDateMs: PURCHASE })).toBeNull();
    expect(warrantyExpiryMs({ purchaseDateMs: PURCHASE, warrantyMonths: 0 })).toBeNull();
  });
});

describe('planReminders', () => {
  const now = PURCHASE + 1 * DAY_MS; // day after purchase

  it('plans all three reminders for a 30d return + 12mo warranty item', () => {
    const plan = planReminders(
      { purchaseDateMs: PURCHASE, returnWindowDays: 30, warrantyMonths: 12 },
      now,
    );
    const kinds = plan.map((p) => p.kind);
    expect(kinds).toEqual(['return', 'nudge', 'expiry']);
  });

  it('fires return reminder RETURN_LEAD_DAYS before the deadline', () => {
    const plan = planReminders({ purchaseDateMs: PURCHASE, returnWindowDays: 30 }, now);
    expect(plan).toHaveLength(1);
    expect(plan[0]?.fireAtMs).toBe(PURCHASE + (30 - RETURN_LEAD_DAYS) * DAY_MS);
  });

  it('fires expiry and nudge reminders with their leads', () => {
    const plan = planReminders({ purchaseDateMs: PURCHASE, warrantyMonths: 12 }, now);
    const expiry = Date.UTC(2027, 0, 15);
    expect(plan.map((p) => [p.kind, p.fireAtMs])).toEqual([
      ['nudge', expiry - NUDGE_LEAD_DAYS * DAY_MS],
      ['expiry', expiry - EXPIRY_LEAD_DAYS * DAY_MS],
    ]);
  });

  it('drops reminders whose fire time is already past', () => {
    const lateNow = PURCHASE + 29 * DAY_MS; // return reminder (day 28) already gone
    const plan = planReminders(
      { purchaseDateMs: PURCHASE, returnWindowDays: 30, warrantyMonths: 12 },
      lateNow,
    );
    expect(plan.map((p) => p.kind)).toEqual(['nudge', 'expiry']);
  });

  it('drops the nudge for short warranties where it would fire immediately', () => {
    // 1-month warranty: nudge would fire at expiry-30d ≈ purchase time — already past `now`.
    const plan = planReminders({ purchaseDateMs: PURCHASE, warrantyMonths: 1 }, now);
    expect(plan.map((p) => p.kind)).toEqual(['expiry']);
  });

  it('returns empty plan when item has neither window nor warranty', () => {
    expect(planReminders({ purchaseDateMs: PURCHASE }, now)).toEqual([]);
  });
});
