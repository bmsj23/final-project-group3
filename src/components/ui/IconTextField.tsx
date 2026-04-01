import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors } from '../../theme/colors';
import { radius } from '../../theme/radius';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type IconTextFieldProps = ComponentProps<typeof TextInput> & {
  label?: string;
  hint?: string;
  error?: string;
  leadingIcon?: keyof typeof Ionicons.glyphMap;
  trailingIcon?: keyof typeof Ionicons.glyphMap;
  shellStyle?: StyleProp<ViewStyle>;
};

export function IconTextField({
  error,
  hint,
  label,
  leadingIcon,
  shellStyle,
  trailingIcon,
  style,
  ...props
}: IconTextFieldProps) {
  return (
    <View style={styles.field}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputShell, shellStyle]}>
        {leadingIcon ? <Ionicons color={colors.softDark} name={leadingIcon} size={18} /> : null}
        <TextInput
          placeholderTextColor={colors.textMuted}
          style={[styles.input, style]}
          {...props}
        />
        {trailingIcon ? <Ionicons color={colors.textMuted} name={trailingIcon} size={18} /> : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.xs,
  },
  label: {
    ...typography.caption3,
    color: colors.softDark,
  },
  inputShell: {
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 54,
    paddingHorizontal: spacing.md,
  },
  input: {
    ...typography.body2,
    color: colors.text,
    flex: 1,
    minHeight: 52,
    paddingVertical: spacing.sm,
  },
  hint: {
    ...typography.caption2,
    color: colors.textMuted,
  },
  error: {
    ...typography.caption2,
    color: colors.error,
  },
});
