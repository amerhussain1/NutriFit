import React, { useEffect, useRef } from 'react';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthNavigator from './AuthNavigator';
import MainTabs from './MainTabs';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import MealDetailScreen from '../screens/main/MealDetailScreen';
import ReplaceMealScreen from '../screens/main/ReplaceMealScreen';
import FoodDetailScreen from '../screens/main/FoodDetailScreen';
import EditFoodLogScreen from '../screens/main/EditFoodLogScreen';
import BudgetScreen from '../screens/main/BudgetScreen';
import GroceryScreen from '../screens/main/GroceryScreen';
import FavoritesScreen from '../screens/main/FavoritesScreen';
import AdminScreen from '../screens/main/AdminScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import EditGoalScreen from '../screens/profile/EditGoalScreen';
import EditBudgetScreen from '../screens/profile/EditBudgetScreen';
import EditPreferencesScreen from '../screens/profile/EditPreferencesScreen';
import BootScreen from '../components/common/BootScreen';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loadUserData } from '../store/slices/dataSlice';
import { useAppTheme } from '../theme';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const theme = useAppTheme();
  const dispatch = useAppDispatch();
  const auth = useAppSelector(state => state.auth);
  const data = useAppSelector(state => state.data);
  const loadedUser = useRef<string | null>(null);

  useEffect(() => {
    if (auth.status === 'authenticated' && auth.session) {
      const userId = auth.session.user.id;
      if (loadedUser.current !== userId) {
        loadedUser.current = userId;
        dispatch(loadUserData(userId));
      }
    }
    if (auth.status === 'unauthenticated') {
      loadedUser.current = null;
    }
  }, [auth.status, auth.session, dispatch]);

  const navTheme = {
    ...(theme.dark ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme.dark ? DarkTheme.colors : DefaultTheme.colors),
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.primary,
    },
  };

  const booting =
    auth.status === 'loading' ||
    (auth.status === 'authenticated' && !data.initialized && data.status !== 'error');

  const retry = () => {
    if (auth.session) {
      dispatch(loadUserData(auth.session.user.id));
    }
  };

  const renderContent = () => {
    if (!data.initialized && data.status === 'error' && auth.status === 'authenticated') {
      return <BootScreen error={data.error ?? 'errors.network'} onRetry={retry} />;
    }
    if (booting) {
      return <BootScreen />;
    }
    if (auth.status !== 'authenticated') {
      return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Auth" component={AuthNavigator} />
        </Stack.Navigator>
      );
    }
    if (!data.profile) {
      return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        </Stack.Navigator>
      );
    }
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="MealDetail" component={MealDetailScreen} />
        <Stack.Screen name="ReplaceMeal" component={ReplaceMealScreen} />
        <Stack.Screen name="FoodDetail" component={FoodDetailScreen} />
        <Stack.Screen name="EditFoodLog" component={EditFoodLogScreen} />
        <Stack.Screen name="Budget" component={BudgetScreen} />
        <Stack.Screen name="Grocery" component={GroceryScreen} />
        <Stack.Screen name="Favorites" component={FavoritesScreen} />
        <Stack.Screen name="Admin" component={AdminScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="EditGoal" component={EditGoalScreen} />
        <Stack.Screen name="EditBudget" component={EditBudgetScreen} />
        <Stack.Screen name="EditPreferences" component={EditPreferencesScreen} />
      </Stack.Navigator>
    );
  };

  return <NavigationContainer theme={navTheme}>{renderContent()}</NavigationContainer>;
}
