import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { CreateEventScreen } from '../features/events/screens/CreateEventScreen';
import { TermsPolicyScreen } from '../features/auth/screens/TermsPolicyScreen';
import { EditEventScreen } from '../features/events/screens/EditEventScreen';
import { EventDetailScreen } from '../features/events/screens/EventDetailScreen';
import { AdminUsersScreen } from '../features/admin/screens/AdminUsersScreen';
import { EditProfileScreen } from '../features/profile/edit-profile/EditProfileScreen';
import { HelpScreen } from '../features/profile/help/HelpScreen';
import { PrivacyScreen } from '../features/profile/privacy/PrivacyScreen';
import { NotificationScreen } from '../features/notifications/screens/NotificationScreen';
import { colors } from '../theme/colors';
import { fontFamily } from '../theme/typography';
import { AppTabsNavigator } from './AppTabsNavigator';
import type { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.background },
        headerShown: false,
      }}
    >
      <Stack.Screen component={AppTabsNavigator} name="Tabs" options={{ headerShown: false }} />
      <Stack.Screen component={CreateEventScreen} name="CreateEvent" />
      <Stack.Screen component={EventDetailScreen} name="EventDetail" />
      <Stack.Screen component={EditEventScreen} name="EditEvent" />
      <Stack.Screen component={AdminUsersScreen} name="AdminUsers" />
      <Stack.Screen component={NotificationScreen} name="Notifications" />
      <Stack.Screen component={EditProfileScreen} name="EditProfile" />
      <Stack.Screen component={PrivacyScreen} name="Privacy" />
      <Stack.Screen component={TermsPolicyScreen} name="TermsPolicy" />
      <Stack.Screen component={HelpScreen} name="Help" />
    </Stack.Navigator>
  );
}
