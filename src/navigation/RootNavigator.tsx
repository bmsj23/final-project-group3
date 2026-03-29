import { DefaultTheme, NavigationContainer } from '@react-navigation/native';

import { useAppSession } from '../providers/AppSessionProvider';
import { colors } from '../theme/colors';
import { AppTabsNavigator } from './AppTabsNavigator';
import { AuthNavigator } from './AuthNavigator';

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    border: colors.border,
    card: colors.surface,
    notification: colors.primary,
    primary: colors.primary,
    text: colors.text,
  },
};

export function RootNavigator() {
  const { mode } = useAppSession();

  return (
    <NavigationContainer theme={navigationTheme}>
      {mode === 'unauthenticated' ? <AuthNavigator /> : <AppTabsNavigator />}
    </NavigationContainer>
  );
}
