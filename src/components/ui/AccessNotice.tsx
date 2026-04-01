import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import { radius } from '../../theme/radius';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type AccessNoticeProps = {
  title: string;
  body: string;
};

export function AccessNotice({ title, body }: AccessNoticeProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgInfo,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  title: {
    ...typography.button1,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  body: {
    ...typography.body2,
    color: colors.softDark,
  },
});
