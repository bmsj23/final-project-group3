import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  SignUp: undefined;
};

export type AppTabParamList = {
  Home: undefined;
  Explore: undefined;
  MyEvents: undefined;
  Profile: undefined;
};

export type AppStackParamList = {
  Tabs: NavigatorScreenParams<AppTabParamList>;
  CreateEvent: undefined;
  EventDetail: { eventId: string };
  EditEvent: { eventId: string };
  Notifications: undefined;
  EditProfile: undefined;
  Privacy: undefined;
  Help: undefined;
};

export type AppTabScreenProps<RouteName extends keyof AppTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<AppTabParamList, RouteName>,
  NativeStackScreenProps<AppStackParamList>
>;
