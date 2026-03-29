import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
};

export function PrimaryButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
}: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' ? styles.primary : styles.secondary,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}
    >
      <Text style={[styles.label, variant === 'primary' ? styles.primaryLabel : styles.secondaryLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: 14,
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.55,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryLabel: {
    color: colors.surface,
  },
  secondaryLabel: {
    color: colors.text,
  },
});
