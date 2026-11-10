import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import HomeScreen from '../screens/main/HomeScreen';
import PlanScreen from '../screens/main/PlanScreen';
import FoodCatalogueScreen from '../screens/main/FoodCatalogueScreen';
import ProgressScreen from '../screens/main/ProgressScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import { useAppTheme } from '../theme';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, { active: string; inactive: string }> = {
  HomeTab: { active: 'home', inactive: 'home-outline' },
  PlanTab: { active: 'calendar', inactive: 'calendar-outline' },
  FoodTab: { active: 'restaurant', inactive: 'restaurant-outline' },
  ProgressTab: { active: 'stats-chart', inactive: 'stats-chart-outline' },
  ProfileTab: { active: 'person', inactive: 'person-outline' },
};

export default function MainTabs() {
  const theme = useAppTheme();
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: styles.label,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
          },
        ],
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons
            name={focused ? ICONS[route.name].active : ICONS[route.name].inactive}
            size={size ?? 22}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: t('tabs.home') }} />
      <Tab.Screen name="PlanTab" component={PlanScreen} options={{ title: t('tabs.plan') }} />
      <Tab.Screen name="FoodTab" component={FoodCatalogueScreen} options={{ title: t('tabs.food') }} />
      <Tab.Screen name="ProgressTab" component={ProgressScreen} options={{ title: t('tabs.progress') }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: t('tabs.profile') }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    height: 62,
    paddingTop: 6,
    paddingBottom: 8,
  },
  label: { fontSize: 10, fontWeight: '600' },
});
