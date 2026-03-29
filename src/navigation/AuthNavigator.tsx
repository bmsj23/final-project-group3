import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { SignInScreen } from '../features/auth/screens/SignInScreen';
import { SignUpScreen } from '../features/auth/screens/SignUpScreen';
import { WelcomeScreen } from '../features/auth/screens/WelcomeScreen';
import { colors } from '../theme/colors';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
      }}
    >
      <Stack.Screen component={WelcomeScreen} name="Welcome" options={{ headerShown: false }} />
      <Stack.Screen component={SignInScreen} name="SignIn" options={{ title: 'Sign In' }} />
      <Stack.Screen component={SignUpScreen} name="SignUp" options={{ title: 'Sign Up' }} />
    </Stack.Navigator>
  );
}
