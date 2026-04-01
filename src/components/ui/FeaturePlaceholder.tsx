import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import { radius } from '../../theme/radius';
import { shadows } from '../../theme/shadows';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { ScreenContainer } from './ScreenContainer';

type FeaturePlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
  highlights: string[];
  footer?: ReactNode;
};

export function FeaturePlaceholder({
  eyebrow,
  title,
  description,
  highlights,
  footer,
}: FeaturePlaceholderProps) {
  return (
    <ScreenContainer scroll>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ready for the next implementation step</Text>
        {highlights.map((item) => (
          <Text key={item} style={styles.highlight}>
            - {item}
          </Text>
        ))}
      </View>

      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    ...typography.caption3,
    color: colors.primary,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  title: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body1,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    gap: spacing.sm,
    padding: spacing.lg,
    ...shadows.card,
  },
  cardTitle: {
    ...typography.h5,
    color: colors.text,
    fontSize: 18,
    marginBottom: spacing.xs,
  },
  highlight: {
    ...typography.body2,
    color: colors.textMuted,
    lineHeight: 22,
  },
  footer: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
});
