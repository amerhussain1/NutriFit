import type {
  CompositeNavigationProp,
  NavigatorScreenParams,
} from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  PlanTab: undefined;
  FoodTab: undefined;
  ProgressTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList> | undefined;
  Onboarding: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  FoodDetail: { foodId: string };
  MealDetail: { dayId: string; itemId: string };
  ReplaceMeal: { dayId: string; itemId: string };
  Budget: undefined;
  EditFoodLog: { logId: string };
  EditProfile: undefined;
  EditGoal: undefined;
  EditBudget: undefined;
  EditPreferences: undefined;
  Grocery: undefined;
  Favorites: undefined;
  Admin: undefined;
};

export type MainTabNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
