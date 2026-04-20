import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '../../../theme/colors';
import { radius } from '../../../theme/radius';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';

type CategoryPillProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: string;
};

export function CategoryPill({ icon, label, onPress, selected }: CategoryPillProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.base, selected ? styles.selected : styles.unselected]}
    >
      {icon ? (
        <Ionicons
          color={selected ? colors.white : colors.text}
          name={icon as keyof typeof Ionicons.glyphMap}
          size={14}
          style={styles.icon}
        />
      ) : null}
      <Text style={[styles.label, selected ? styles.selectedLabel : styles.unselectedLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}


const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: radius.full,
    flexDirection: 'row',
    justifyContent: 'center',
    marginRight: spacing.xs,
    minHeight: 40,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  icon: {
    marginRight: spacing.xs,
  },
  selected: {
    backgroundColor: colors.primary,
  },
  unselected: {
    backgroundColor: colors.bgCard,
    borderColor: colors.border,
    borderWidth: 1,
  },
  label: {
    ...typography.body2,
  },
  selectedLabel: {
    color: colors.white,
  },
  unselectedLabel: {
    color: colors.text,
  },
});
