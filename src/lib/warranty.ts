import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export interface WarrantyInput {
  purchaseDateMs: number;
  returnWindowDays?: number | null;
  warrantyMonths?: number | null;
}

export type ReminderKind = 'return' | 'nudge' | 'expiry';

export interface ReminderPlanEntry {
  kind: ReminderKind;
  fireAtMs: number;
}

/** Days before the return deadline that the return reminder fires. */
export const RETURN_LEAD_DAYS = 2;
/** Days before warranty expiry that the final expiry reminder fires. */
export const EXPIRY_LEAD_DAYS = 7;
/** Days before warranty expiry for the "test your device now" nudge. */
export const NUDGE_LEAD_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Last day the item can be returned, or null when no return window applies. */
export function returnDeadlineMs(input: WarrantyInput): number | null {
  if (!input.returnWindowDays) return null;
  return input.purchaseDateMs + input.returnWindowDays * DAY_MS;
}

/**
 * Warranty end date, or null when no warranty applies.
 * Calendar-month arithmetic (Jan 15 + 1mo = Feb 15; Jan 31 + 1mo = Feb 28) —
 * matches how manufacturers state warranty periods.
 */
export function warrantyExpiryMs(input: WarrantyInput): number | null {
  if (!input.warrantyMonths) return null;
  return dayjs.utc(input.purchaseDateMs).add(input.warrantyMonths, 'month').valueOf();
}

/**
 * Compute the reminder schedule for an item. Entries are ordered by fire time;
 * anything that would fire at or before `nowMs` is dropped rather than fired late.
 */
export function planReminders(input: WarrantyInput, nowMs: number): ReminderPlanEntry[] {
  const plan: ReminderPlanEntry[] = [];

  const returnDeadline = returnDeadlineMs(input);
  if (returnDeadline !== null) {
    plan.push({ kind: 'return', fireAtMs: returnDeadline - RETURN_LEAD_DAYS * DAY_MS });
  }

  const expiry = warrantyExpiryMs(input);
  if (expiry !== null) {
    plan.push({ kind: 'nudge', fireAtMs: expiry - NUDGE_LEAD_DAYS * DAY_MS });
    plan.push({ kind: 'expiry', fireAtMs: expiry - EXPIRY_LEAD_DAYS * DAY_MS });
  }

  return plan
    .filter((entry) => entry.fireAtMs > nowMs)
    .sort((a, b) => a.fireAtMs - b.fireAtMs);
}

/** Warranty expiring within this many days counts as "expiring soon" on the dashboard. */
export const EXPIRING_SOON_DAYS = 30;

export interface ProtectionSummary {
  protectedCount: number;
  protectedValueMinor: number;
  expiringSoonCount: number;
}

interface ProtectableItem {
  amountMinor: number;
  spentAt: number;
  warrantyMonths: number | null;
}

/** Dashboard rollup: how much purchase value is still under warranty. Pure. */
export function protectionSummary(
  items: readonly ProtectableItem[],
  nowMs: number,
): ProtectionSummary {
  let protectedCount = 0;
  let protectedValueMinor = 0;
  let expiringSoonCount = 0;

  for (const item of items) {
    const expiry = warrantyExpiryMs({
      purchaseDateMs: item.spentAt,
      warrantyMonths: item.warrantyMonths,
    });
    if (expiry === null || expiry <= nowMs) continue;
    protectedCount += 1;
    protectedValueMinor += item.amountMinor;
    if (expiry - nowMs <= EXPIRING_SOON_DAYS * DAY_MS) expiringSoonCount += 1;
  }

  return { protectedCount, protectedValueMinor, expiringSoonCount };
}
