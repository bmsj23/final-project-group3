import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
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
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  description: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  highlight: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  footer: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
});
