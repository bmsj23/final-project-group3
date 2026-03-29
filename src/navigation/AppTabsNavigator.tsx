import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { MyEventsScreen } from '../features/bookings/screens/MyEventsScreen';
import { ExploreScreen } from '../features/events/screens/ExploreScreen';
import { HomeScreen } from '../features/events/screens/HomeScreen';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';
import { colors } from '../theme/colors';
import type { AppTabParamList } from './types';

const Tab = createBottomTabNavigator<AppTabParamList>();

export function AppTabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      <Tab.Screen component={HomeScreen} name="Home" options={{ title: 'Home' }} />
      <Tab.Screen component={ExploreScreen} name="Explore" options={{ title: 'Explore' }} />
      <Tab.Screen component={MyEventsScreen} name="MyEvents" options={{ title: 'My Events' }} />
      <Tab.Screen component={ProfileScreen} name="Profile" options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
