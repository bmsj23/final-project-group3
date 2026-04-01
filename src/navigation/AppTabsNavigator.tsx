import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, View } from 'react-native';

import { MyEventsScreen } from '../features/bookings/screens/MyEventsScreen';
import { ExploreScreen } from '../features/events/screens/ExploreScreen';
import { HomeScreen } from '../features/events/screens/HomeScreen';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';
import { colors } from '../theme/colors';
import { fontFamily } from '../theme/typography';
import type { AppTabParamList } from './types';

const Tab = createBottomTabNavigator<AppTabParamList>();

const TAB_ICONS: Record<keyof AppTabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'home',
  Explore: 'compass',
  MyEvents: 'calendar',
  Profile: 'person',
};

const TAB_ICONS_OUTLINE: Record<keyof AppTabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'home-outline',
  Explore: 'compass-outline',
  MyEvents: 'calendar-outline',
  Profile: 'person-outline',
};

function TabIcon({ name, focused, color }: { name: keyof AppTabParamList; focused: boolean; color: string }) {
  const iconName = focused ? TAB_ICONS[name] : TAB_ICONS_OUTLINE[name];
  return (
    <View style={styles.iconContainer}>
      <Ionicons color={color} name={iconName} size={24} />
    </View>
  );
}

export function AppTabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.bgCard,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          elevation: 8,
          height: 76,
          paddingBottom: 10,
          paddingTop: 8,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontFamily: fontFamily.medium,
          fontSize: 11,
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        component={HomeScreen}
        name="Home"
        options={{
          headerShown: false,
          tabBarIcon: ({ focused, color }) => <TabIcon color={color} focused={focused} name="Home" />,
        }}
      />
      <Tab.Screen
        component={ExploreScreen}
        name="Explore"
        options={{
          headerShown: false,
          tabBarIcon: ({ focused, color }) => <TabIcon color={color} focused={focused} name="Explore" />,
        }}
      />
      <Tab.Screen
        component={MyEventsScreen}
        name="MyEvents"
        options={{
          title: 'My Events',
          headerShown: false,
          tabBarIcon: ({ focused, color }) => <TabIcon color={color} focused={focused} name="MyEvents" />,
        }}
      />
      <Tab.Screen
        component={ProfileScreen}
        name="Profile"
        options={{
          headerShown: false,
          tabBarIcon: ({ focused, color }) => <TabIcon color={color} focused={focused} name="Profile" />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
