import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '../../../theme/colors';
import { radius } from '../../../theme/radius';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';

type CategoryPillProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function CategoryPill({ label, onPress, selected }: CategoryPillProps) {
  const opacity = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.timing(opacity, { toValue: 0.6, duration: 80, useNativeDriver: true }).start();
  };

  const onPressOut = () => {
    Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={{ opacity }}>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[styles.base, selected ? styles.selected : styles.unselected]}
      >
        <Text style={[styles.label, selected ? styles.selectedLabel : styles.unselectedLabel]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
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
