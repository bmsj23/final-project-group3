import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '../../../theme/colors';
import { fontFamily } from '../../../theme/typography';
import { radius } from '../../../theme/radius';
import { spacing } from '../../../theme/spacing';

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
        <Ionicons
          color={selected ? colors.textLight : colors.text}
          name={resolvedIcon}
          size={14}
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
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    marginRight: spacing.xs,
    minHeight: 40,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  selected: {
    backgroundColor: colors.primary,
  },
  unselected: {
    backgroundColor: colors.bgSubtle,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  selectedLabel: {
    color: colors.textLight,
  },
  unselectedLabel: {
    color: colors.text,
  },
});
