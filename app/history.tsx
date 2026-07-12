import dayjs from 'dayjs';
import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { toCsv } from '@/lib/csv';
import { recentMonths } from '@/lib/date';
import { formatINR } from '@/lib/money';
import { exportExpensesCsv } from '@/services/export';
import { useExpenseStore } from '@/state/expense-store';
import { layout, mono, paper, type } from '@/theme';
import type { Category, Expense, ExpenseFilter } from '@/types';

interface DaySection {
  title: string;
  totalMinor: number;
  data: Expense[];
}

function groupByDay(expenses: readonly Expense[]): DaySection[] {
  const sections = new Map<string, DaySection>();
  for (const e of expenses) {
    const key = dayjs(e.spentAt).format('YYYY-MM-DD');
    let section = sections.get(key);
    if (!section) {
      section = { title: dayjs(e.spentAt).format('ddd DD MMM').toUpperCase(), totalMinor: 0, data: [] };
      sections.set(key, section);
    }
    section.totalMinor += e.amountMinor;
    section.data.push(e);
  }
  return [...sections.values()];
}

const MONTH_COUNT = 6;

interface Chip {
  key: string;
  label: string;
  selected: boolean;
  onPress: () => void;
}

function ChipRow({ chips, label }: { chips: Chip[]; label: string }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.chipRow}
      contentContainerStyle={styles.chipRowContent}
      accessibilityLabel={label}
    >
      {chips.map((chip) => (
        <Pressable
          key={chip.key}
          onPress={chip.onPress}
          accessibilityRole="button"
          accessibilityState={{ selected: chip.selected }}
          style={[styles.chip, chip.selected && styles.chipSelected]}
        >
          <Text style={[styles.chipText, chip.selected && styles.chipTextSelected]}>
            {chip.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

export default function HistoryScreen() {
  const { expenses, categories, loadExpenses, loadCategories } = useExpenseStore();
  const [search, setSearch] = useState('');
  const [month, setMonth] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);

  const onExport = useCallback(async () => {
    if (expenses.length === 0) return;
    if (categories.length === 0) await loadCategories();
    const latestCategories = useExpenseStore.getState().categories;
    await exportExpensesCsv(toCsv(expenses, latestCategories));
  }, [expenses, categories, loadCategories]);

  const reload = useCallback(
    (term: string, selectedMonth: string | null, selectedCategoryId: number | undefined) => {
      const filter: ExpenseFilter = {};
      const trimmed = term.trim();
      if (trimmed) filter.search = trimmed;
      if (selectedMonth) filter.month = selectedMonth;
      if (selectedCategoryId !== undefined) filter.categoryId = selectedCategoryId;
      void loadExpenses(Object.keys(filter).length > 0 ? filter : undefined);
    },
    [loadExpenses],
  );

  useFocusEffect(
    useCallback(() => {
      void loadCategories();
      reload(search, month, categoryId);
    }, [reload, search, month, categoryId, loadCategories]),
  );

  const monthChips = useMemo<Chip[]>(() => {
    const allChip: Chip = {
      key: 'all-months',
      label: 'All',
      selected: month === null,
      onPress: () => setMonth(null),
    };
    const chips = recentMonths(MONTH_COUNT).map<Chip>((m) => ({
      key: m,
      label: m,
      selected: month === m,
      onPress: () => setMonth(m),
    }));
    return [allChip, ...chips];
  }, [month]);

  const categoryChips = useMemo<Chip[]>(() => {
    const allChip: Chip = {
      key: 'all-categories',
      label: 'All',
      selected: categoryId === undefined,
      onPress: () => setCategoryId(undefined),
    };
    const chips = categories.map<Chip>((c: Category) => ({
      key: String(c.id),
      label: c.name,
      selected: categoryId === c.id,
      onPress: () => setCategoryId(c.id),
    }));
    return [allChip, ...chips];
  }, [categories, categoryId]);

  return (
    <View style={styles.container}>
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search merchant or note"
        style={styles.search}
        accessibilityLabel="Search expenses"
      />
      <ChipRow chips={monthChips} label="Filter by month" />
      <ChipRow chips={categoryChips} label="Filter by category" />
      <Pressable
        onPress={() => void onExport()}
        disabled={expenses.length === 0}
        accessibilityRole="button"
        accessibilityLabel="Export expenses to CSV"
        style={[styles.exportButton, expenses.length === 0 && styles.exportButtonDisabled]}
      >
        <Text style={styles.exportButtonText}>Export CSV</Text>
      </Pressable>
      <SectionList
        sections={useMemo(() => groupByDay(expenses), [expenses])}
        keyExtractor={(e) => String(e.id)}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={<Text style={styles.empty}>No matching expenses.</Text>}
        renderSectionHeader={({ section }) => (
          <View style={styles.dayHeader}>
            <Text style={styles.dayTitle}>{section.title}</Text>
            <Text style={styles.dayTotal}>{formatINR(section.totalMinor)}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <Link href={{ pathname: '/expense/[id]', params: { id: item.id } }} asChild>
            <Pressable style={styles.row}>
              <Text style={styles.merchant} numberOfLines={1}>
                {(item.merchant ?? 'Unknown').toUpperCase()}
              </Text>
              <Text style={styles.rowDots} numberOfLines={1}>
                ............................
              </Text>
              <Text style={styles.amount}>{formatINR(item.amountMinor)}</Text>
            </Pressable>
          </Link>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: layout.screenPad, backgroundColor: paper.bg },
  search: {
    fontFamily: mono,
    borderWidth: 1.5,
    borderColor: paper.ink,
    borderRadius: 3,
    backgroundColor: paper.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 14,
    color: paper.ink,
  },
  chipRow: { marginBottom: 12, flexGrow: 0 },
  chipRowContent: { gap: 8, paddingRight: 4 },
  chip: {
    borderWidth: 1.5,
    borderColor: paper.inkFaint,
    borderRadius: 3,
    backgroundColor: paper.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipSelected: { backgroundColor: paper.ink, borderColor: paper.ink },
  chipText: {
    fontFamily: mono,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: paper.inkFaded,
  },
  chipTextSelected: { color: paper.card, fontWeight: '700' },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 14,
    paddingBottom: 4,
    borderBottomWidth: 2,
    borderBottomColor: paper.ink,
  },
  dayTitle: { ...type.label, fontSize: 11, color: paper.ink },
  dayTotal: { fontFamily: mono, fontSize: 12, fontWeight: '700', color: paper.ink },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingVertical: 11,
    gap: 6,
    ...layout.tearline,
  },
  merchant: { ...type.body, fontWeight: '600', flexShrink: 1 },
  rowDots: { ...type.body, color: paper.inkFaint, flex: 1 },
  amount: { ...type.body, ...type.amount },
  empty: { ...type.label, paddingVertical: 24, textAlign: 'center' },
  exportButton: {
    backgroundColor: paper.ink,
    borderRadius: 3,
    paddingVertical: 11,
    marginBottom: 12,
    alignItems: 'center',
  },
  exportButtonDisabled: { opacity: 0.4 },
  exportButtonText: {
    fontFamily: mono,
    color: paper.card,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
