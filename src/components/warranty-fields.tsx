import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { mono, paper } from '@/theme';

const RETURN_PRESETS = [7, 15, 30] as const;
const WARRANTY_PRESETS = [6, 12, 24] as const;

export interface WarrantyFieldsValue {
  itemName: string;
  returnWindowDays: string;
  warrantyMonths: string;
}

interface WarrantyFieldsProps {
  value: WarrantyFieldsValue;
  onChange(patch: Partial<WarrantyFieldsValue>): void;
}

/** Item name + return-window and warranty chips shared by the review and edit screens. */
export function WarrantyFields({ value, onChange }: WarrantyFieldsProps) {
  return (
    <>
      <View style={styles.field}>
        <Text style={styles.label}>Item (what you bought)</Text>
        <TextInput
          value={value.itemName}
          onChangeText={(itemName) => onChange({ itemName })}
          style={styles.input}
          placeholder="e.g. Headphones"
          accessibilityLabel="Item name"
        />
      </View>

      <ChipRow
        label="Return window"
        presets={RETURN_PRESETS}
        format={(d) => `${d} days`}
        selected={value.returnWindowDays}
        placeholder="days"
        onSelect={(returnWindowDays) => onChange({ returnWindowDays })}
      />

      <ChipRow
        label="Warranty"
        presets={WARRANTY_PRESETS}
        format={(m) => (m % 12 === 0 ? `${m / 12} yr` : `${m} mo`)}
        selected={value.warrantyMonths}
        placeholder="months"
        onSelect={(warrantyMonths) => onChange({ warrantyMonths })}
      />
    </>
  );
}

interface ChipRowProps {
  label: string;
  presets: readonly number[];
  format(preset: number): string;
  selected: string;
  placeholder: string;
  onSelect(value: string): void;
}

function ChipRow({ label, presets, format, selected, placeholder, onSelect }: ChipRowProps) {
  const isPreset = presets.some((p) => String(p) === selected);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chips}>
        <Chip label="None" active={selected === ''} onPress={() => onSelect('')} />
        {presets.map((p) => (
          <Chip
            key={p}
            label={format(p)}
            active={String(p) === selected}
            onPress={() => onSelect(String(p))}
          />
        ))}
        <TextInput
          value={isPreset ? '' : selected}
          onChangeText={onSelect}
          keyboardType="number-pad"
          style={styles.customInput}
          placeholder={placeholder}
          accessibilityLabel={`Custom ${label.toLowerCase()} ${placeholder}`}
        />
      </View>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress(): void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: {
    fontFamily: mono,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: paper.inkFaded,
  },
  input: {
    fontFamily: mono,
    borderWidth: 1.5,
    borderColor: paper.ink,
    borderRadius: 3,
    backgroundColor: paper.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: paper.ink,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: paper.inkFaint,
    backgroundColor: paper.card,
  },
  chipActive: { backgroundColor: paper.accent, borderColor: paper.accent },
  chipText: {
    fontFamily: mono,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: paper.ink,
  },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  customInput: {
    fontFamily: mono,
    borderWidth: 1.5,
    borderColor: paper.inkFaint,
    borderRadius: 3,
    backgroundColor: paper.card,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    color: paper.ink,
    minWidth: 72,
  },
});
