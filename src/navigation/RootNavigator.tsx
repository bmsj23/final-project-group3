import { DefaultTheme, NavigationContainer } from '@react-navigation/native';

import { useAppSession } from '../providers/AppSessionProvider';
import { colors } from '../theme/colors';
import { AppNavigator } from './AppNavigator';
import { AuthNavigator } from './AuthNavigator';

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    border: colors.border,
    card: colors.bgCard,
    notification: colors.primary,
    primary: colors.primary,
    text: colors.text,
  },
};

export function RootNavigator() {
  const { isInitializing, mode } = useAppSession();

  if (isInitializing) {
    return null;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      {mode === 'unauthenticated' ? <AuthNavigator /> : <AppNavigator />}
    </NavigationContainer>
  );
}
