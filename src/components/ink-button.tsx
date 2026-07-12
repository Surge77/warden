import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { mono, paper } from '@/theme';

type Variant = 'primary' | 'ink' | 'ghost' | 'danger';

interface InkButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: Variant;
}

/** Hard-cornered printer-ink button. Pressed state nudges down like a stamp. */
export function InkButton({ label, variant = 'ink', disabled, ...rest }: InkButtonProps) {
  return (
    <Pressable
      {...rest}
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.text, variant === 'ghost' && styles.textGhost]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    borderRadius: 3,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: paper.ink,
  },
  primary: { backgroundColor: paper.accent, borderColor: paper.accent },
  ink: { backgroundColor: paper.ink },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: paper.danger, borderColor: paper.danger },
  pressed: { transform: [{ translateY: 2 }], opacity: 0.9 },
  disabled: { opacity: 0.4 },
  text: {
    fontFamily: mono,
    color: paper.card,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  textGhost: { color: paper.ink },
});
