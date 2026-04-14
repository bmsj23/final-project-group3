import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fontFamily, typography } from '../../theme/typography';

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  onPressAction?: () => void;
  icon?: ReactNode;
};

export function SectionHeader({ actionLabel, icon, onPressAction, title }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.titleWrap}>
        <Text style={styles.title}>{title}</Text>
        {icon}
      </View>
      {actionLabel && onPressAction ? (
        <Pressable accessibilityRole="button" onPress={onPressAction}>
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  titleWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  title: {
    ...typography.h5,
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: 17,
    letterSpacing: -0.3,
  },
  action: {
    ...typography.caption3,
    color: colors.primary,
    letterSpacing: 0.8,
  },
});
