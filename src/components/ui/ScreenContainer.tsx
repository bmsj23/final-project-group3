import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type ScreenContainerProps = {
  children: ReactNode;
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

export function ScreenContainer({
  children,
  scroll = false,
  contentContainerStyle,
}: ScreenContainerProps) {
  if (scroll) {
    return (
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={[styles.content, contentContainerStyle]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
  },
});
