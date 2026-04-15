import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../../theme/colors';
import { radius } from '../../../theme/radius';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';

// Map DB icon names that don't match Ionicons glyph names exactly.
const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  users: 'people-outline',
  music: 'musical-notes-outline',
  food: 'fast-food-outline',
  tech: 'laptop-outline',
  film: 'film-outline',
  heart: 'heart-outline',
  star: 'star-outline',
};

type CategoryPillProps = {
  label: string;
  selected: boolean;
  icon?: string;
  onPress: () => void;
};

export function CategoryPill({ label, onPress, selected, icon }: CategoryPillProps) {
  const resolvedIcon = icon ? (ICON_MAP[icon] ?? (icon as keyof typeof Ionicons.glyphMap)) : undefined;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.base, selected ? styles.selected : styles.unselected]}
    >
      {resolvedIcon ? (
        <View style={[styles.iconCircle, selected ? styles.iconCircleSelected : styles.iconCircleUnselected]}>
          <Ionicons
            color={selected ? colors.primary : colors.textMuted}
            name={resolvedIcon}
            size={14}
          />
        </View>
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
    gap: spacing.xs,
    justifyContent: 'center',
    marginRight: spacing.xs,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  selected: {
    backgroundColor: colors.primary,
  },
  unselected: {
    backgroundColor: colors.bgCard,
    borderColor: colors.border,
    borderWidth: 1,
  },
  iconCircle: {
    alignItems: 'center',
    borderRadius: radius.full,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  iconCircleSelected: {
    backgroundColor: colors.white,
  },
  iconCircleUnselected: {
    backgroundColor: colors.grey,
  },
  label: {
    ...typography.body3,
    lineHeight: 18,
  },
  selectedLabel: {
    color: colors.white,
  },
  unselectedLabel: {
    color: colors.text,
  },
});
