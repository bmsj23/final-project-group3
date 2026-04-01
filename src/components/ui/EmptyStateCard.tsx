import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../theme/colors';
import { radius } from '../../theme/radius';
import { shadows } from '../../theme/shadows';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type EmptyStateCardProps = {
  title: string;
  body: string;
  icon?: keyof typeof Ionicons.glyphMap;
  footer?: ReactNode;
};

export function EmptyStateCard({
  title,
  body,
  icon = 'sparkles-outline',
  footer,
}: EmptyStateCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons color={colors.primary} name={icon} size={22} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    gap: spacing.sm,
    padding: spacing.xxl,
    ...shadows.card,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: colors.bgInfo,
    borderRadius: radius.full,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  title: {
    ...typography.h5,
    color: colors.text,
    fontSize: 18,
    textAlign: 'center',
  },
  body: {
    ...typography.body2,
    color: colors.textMuted,
    textAlign: 'center',
  },
  footer: {
    marginTop: spacing.sm,
    width: '100%',
  },
});
