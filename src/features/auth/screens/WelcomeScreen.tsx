import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { APP_NAME } from '../../../constants/app';
import type { AuthStackParamList } from '../../../navigation/types';
import { useAppSession } from '../../../providers/AppSessionProvider';
import { colors } from '../../../theme/colors';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';

type WelcomeScreenProps = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  const { continueAsGuest } = useAppSession();

  return (
    <ScreenContainer noPadding>
      <View style={styles.topSection}>
        <Text style={styles.logo}>{APP_NAME}</Text>
        <View style={styles.illustrationFrame}>
          <View style={styles.board}>
            <View style={styles.boardRow} />
            <View style={styles.boardRowShort} />
            <View style={styles.boardRow} />
          </View>
          <View style={[styles.figure, styles.figureLeft]}>
            <Ionicons color={colors.primary} name="musical-notes" size={18} />
          </View>
          <View style={[styles.figure, styles.figureCenter]}>
            <Ionicons color={colors.yellow} name="calendar" size={18} />
          </View>
          <View style={[styles.figure, styles.figureRight]}>
            <Ionicons color={colors.green} name="balloon" size={18} />
          </View>
        </View>
      </View>

      <View style={styles.bottomSheet}>
        <Text style={styles.sheetTitle}>Explore upcoming and nearby events</Text>
        <Text style={styles.sheetBody}>
          Discover campus happenings, reserve your slot, and manage your own events with one clean mobile flow.
        </Text>

        <View style={styles.actions}>
          <PrimaryButton label="Sign In" onPress={() => navigation.navigate('SignIn')} variant="dark" />
          <PrimaryButton label="Create Account" onPress={() => navigation.navigate('SignUp')} variant="secondary" />
        </View>

        <PrimaryButton label="Continue as Guest" onPress={() => void continueAsGuest()} variant="secondary" />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topSection: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.huge,
  },
  logo: {
    ...typography.h3,
    color: colors.primaryDeep,
    fontSize: 34,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  illustrationFrame: {
    alignItems: 'center',
    height: 280,
    justifyContent: 'center',
    position: 'relative',
  },
  board: {
    backgroundColor: colors.bgCard,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 2,
    height: 160,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    width: '82%',
    ...shadows.card,
  },
  boardRow: {
    backgroundColor: '#DBEAFE',
    borderRadius: radius.full,
    height: 12,
    marginBottom: spacing.md,
    width: '100%',
  },
  boardRowShort: {
    backgroundColor: '#BFDBFE',
    borderRadius: radius.full,
    height: 12,
    marginBottom: spacing.md,
    width: '72%',
  },
  figure: {
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.full,
    height: 52,
    justifyContent: 'center',
    position: 'absolute',
    width: 52,
    ...shadows.card,
  },
  figureLeft: {
    left: 24,
    top: 118,
  },
  figureCenter: {
    top: 42,
  },
  figureRight: {
    right: 24,
    top: 132,
  },
  bottomSheet: {
    backgroundColor: colors.primary,
    borderTopLeftRadius: 44,
    borderTopRightRadius: 44,
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  sheetTitle: {
    ...typography.h4,
    color: colors.textLight,
    textAlign: 'center',
  },
  sheetBody: {
    ...typography.body1,
    color: 'rgba(255,255,255,0.82)',
    textAlign: 'center',
  },
  actions: {
    gap: spacing.sm,
  },
});
