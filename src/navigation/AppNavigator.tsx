import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { CreateEventScreen } from '../features/events/screens/CreateEventScreen';
import { EditEventScreen } from '../features/events/screens/EditEventScreen';
import { EventDetailScreen } from '../features/events/screens/EventDetailScreen';
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
      <Stack.Screen component={NotificationScreen} name="Notifications" />
    </Stack.Navigator>
  );
}
