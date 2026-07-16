import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { nextDeadline, type NextDeadline } from '@/lib/warranty';
import type { Expense } from '@/types';
import { mono, paper } from '@/theme';

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_TICKETS = 6;

interface Ticket {
  expense: Expense;
  deadline: NextDeadline;
  daysLeft: number;
}

export function upcomingTickets(expenses: readonly Expense[], nowMs: number): Ticket[] {
  return expenses
    .flatMap((expense) => {
      const deadline = nextDeadline(
        {
          purchaseDateMs: expense.spentAt,
          returnWindowDays: expense.returnWindowDays,
          warrantyMonths: expense.warrantyMonths,
        },
        nowMs,
      );
      if (!deadline) return [];
      return [{ expense, deadline, daysLeft: Math.ceil((deadline.atMs - nowMs) / DAY_MS) }];
    })
    .sort((a, b) => a.deadline.atMs - b.deadline.atMs)
    .slice(0, MAX_TICKETS);
}

/** Horizontal strip of countdown tickets — the vault's departure board. */
export function DeadlineDocket({ expenses, nowMs }: { expenses: readonly Expense[]; nowMs: number }) {
  const tickets = upcomingTickets(expenses, nowMs);
  if (tickets.length === 0) return null;

  return (
    <View>
      <Text style={styles.section}>NEXT DEADLINES</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
      {tickets.map(({ expense, deadline, daysLeft }) => {
        const isReturn = deadline.kind === 'return';
        const urgent = daysLeft <= 7;
        return (
          <Link
            key={`${expense.id}-${deadline.kind}`}
            href={{ pathname: '/expense/[id]', params: { id: expense.id } }}
            asChild
          >
            <Pressable style={[styles.ticket, urgent && styles.ticketUrgent]}>
              <View style={styles.ticketHead}>
                <Text style={[styles.kind, isReturn ? styles.kindReturn : styles.kindExpiry]}>
                  {isReturn ? 'RETURN' : 'WARRANTY'}
                </Text>
                <Text style={[styles.days, urgent && styles.daysUrgent]}>
                  {daysLeft}D
                </Text>
              </View>
              <Text style={styles.name} numberOfLines={1}>
                {(expense.itemName ?? expense.merchant ?? 'UNKNOWN').toUpperCase()}
              </Text>
              <Text style={styles.foot}>{isReturn ? 'WINDOW CLOSES' : 'COVER ENDS'}</Text>
            </Pressable>
          </Link>
        );
      })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    fontFamily: mono,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: paper.inkFaded,
    marginTop: 16,
    marginBottom: 8,
  },
  strip: { gap: 10, paddingVertical: 2 },
  ticket: {
    width: 150,
    borderRadius: 3,
    padding: 12,
    backgroundColor: paper.card,
    borderLeftWidth: 3,
    borderLeftColor: paper.accent,
  },
  ticketUrgent: { borderLeftColor: paper.danger },
  ticketHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  kind: { fontFamily: mono, fontSize: 9, letterSpacing: 1.5, fontWeight: '700' },
  kindReturn: { color: paper.danger },
  kindExpiry: { color: paper.accent },
  days: { fontFamily: mono, fontSize: 18, fontWeight: '700', color: paper.ink },
  daysUrgent: { color: paper.danger },
  name: { fontFamily: mono, fontSize: 11, color: paper.ink, marginTop: 8 },
  foot: { fontFamily: mono, fontSize: 8, letterSpacing: 1.5, color: paper.inkFaded, marginTop: 4 },
});
