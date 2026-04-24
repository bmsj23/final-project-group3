import { useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text } from 'react-native';

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
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.parallel([
      Animated.timing(scale, { toValue: 0.94, duration: 80, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.7, duration: 80, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  };

  const onPressOut = () => {
    Animated.parallel([
      Animated.timing(scale, { toValue: 1, duration: 200, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  };

  return (
    <Animated.View style={{ opacity, transform: [{ scale }] }}>
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
