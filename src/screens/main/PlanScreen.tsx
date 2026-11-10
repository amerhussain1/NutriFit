import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Screen from '../../components/common/Screen';
import ScreenHeader from '../../components/common/ScreenHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import ErrorBanner from '../../components/common/ErrorBanner';
import MealCard from '../../components/cards/MealCard';
import StatTile from '../../components/common/StatTile';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  createPlan,
  markMealCompleted,
  setFoods,
  toggleFavorite,
} from '../../store/slices/dataSlice';
import { fetchFoods } from '../../services/data/api';
import { calculateDailyTargets } from '../../utils/nutrition';
import { formatMoney, formatShortDate, toDateKey } from '../../utils/format';
import { isPriceStale } from '../../utils/budget';
import { useAppTheme } from '../../theme';
import type { MainTabNavigation } from '../../navigation/types';

export default function PlanScreen() {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<MainTabNavigation>();
  const dispatch = useAppDispatch();
  const {
    profile,
    goal,
    preferences,
    budget,
    plan,
    foods,
    favorites,
    demo,
    busy,
    error,
  } = useAppSelector(state => state.data);
  const session = useAppSelector(state => state.auth.session);
  const userId = session?.user.id ?? 'demo-user';
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);

  const targets = useMemo(
    () => (profile && goal ? calculateDailyTargets(profile, goal) : null),
    [profile, goal],
  );

  const selectedDay = useMemo(() => {
    if (!plan) {
      return null;
    }
    return plan.days.find(day => day.id === selectedDayId) ?? plan.days.find(day => day.planDate === toDateKey()) ?? plan.days[0] ?? null;
  }, [plan, selectedDayId]);

  const dailyBudget = budget ? (budget.budgetPeriod === 'monthly' ? budget.amount / 30 : budget.amount) : 0;
  const weeklyCost = plan ? plan.days.reduce((sum, day) => sum + day.estimatedCost, 0) : 0;
  const budgetWarning = selectedDay ? selectedDay.estimatedCost > dailyBudget && dailyBudget > 0 : false;
  const stalePrice = useMemo(() => {
    if (!selectedDay) {
      return false;
    }
    return selectedDay.items.some(item => {
      const food = foods.find(f => f.id === item.foodItemId);
      return food ? isPriceStale(food) : true;
    });
  }, [selectedDay, foods]);

  const generate = async () => {
    if (!profile || !goal || !preferences || !budget || !targets) {
      return;
    }
    try {
      let catalogue = foods;
      if (catalogue.length === 0) {
        catalogue = await fetchFoods(profile);
        dispatch(setFoods(catalogue));
      }
      const result = await dispatch(
        createPlan({ userId, profile, goal, preferences, budget, targets, foods: catalogue }),
      ).unwrap();
      setSelectedDayId(result.days[0]?.id ?? null);
    } catch {
      // Error is surfaced from the store.
    }
  };

  const toggleMeal = (itemId: string, completed: boolean) => {
    if (!plan) {
      return;
    }
    dispatch(markMealCompleted({ userId, plan, itemId, completed }));
  };

  if (!plan) {
    return (
      <Screen scroll>
        <ScreenHeader title={t('plan.title')} subtitle={t('app.tagline')} />
        {demo ? <ErrorBanner message={null} /> : null}
        <Card>
          <EmptyState
            icon="calendar-outline"
            title={t('plan.noPlan')}
            body={t('home.noPlanBody')}
            actionTitle={t('plan.generate')}
            onAction={generate}
          />
        </Card>
        <ErrorBanner message={error} />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <ScreenHeader
        title={t('plan.title')}
        subtitle={`${formatShortDate(plan.startDate)} – ${formatShortDate(plan.endDate)}`}
        right={
          <Pressable
            onPress={() =>
              Alert.alert(t('plan.regenerate'), t('plan.budgetWarning'), [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('common.confirm'), onPress: generate },
              ])
            }
            style={[styles.headerAction, { backgroundColor: theme.colors.primarySoft }]}
          >
            <Ionicons name="refresh" size={18} color={theme.colors.primary} />
          </Pressable>
        }
      />
      <ErrorBanner message={error} />

      <View style={styles.statsRow}>
        <StatTile
          icon="wallet-outline"
          label={t('plan.totalCost')}
          value={formatMoney(weeklyCost, plan.currencyCode)}
          hint={t('common.estimated')}
          color={theme.colors.accent}
        />
        <View style={styles.gap} />
        <StatTile
          icon="flame-outline"
          label={t('plan.dailyTarget')}
          value={`${targets?.calories ?? selectedDay?.targetCalories ?? 0}`}
          hint={t('common.kcal')}
        />
        <View style={styles.gap} />
        <StatTile
          icon="calendar-outline"
          label={t('common.week')}
          value={`${plan.days.length}`}
          hint={t('plan.day', { number: '1–7' })}
          color={theme.colors.info}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayRow}>
        {plan.days.map((day, index) => {
          const active = selectedDay?.id === day.id;
          const isToday = day.planDate === toDateKey();
          return (
            <Pressable
              key={day.id}
              onPress={() => setSelectedDayId(day.id)}
              style={[
                styles.dayChip,
                {
                  backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                  borderColor: active ? theme.colors.primary : theme.colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.dayName,
                  { color: active ? '#FFFFFF' : isToday ? theme.colors.primary : theme.colors.textMuted },
                ]}
              >
                {isToday ? t('common.today') : formatShortDate(day.planDate).split(',')[0]}
              </Text>
              <Text style={[styles.dayNumber, { color: active ? '#FFFFFF' : theme.colors.text }]}>
                {index + 1}
              </Text>
              <Text style={[styles.dayCost, { color: active ? 'rgba(255,255,255,0.85)' : theme.colors.textMuted }]}>
                {formatMoney(day.estimatedCost, day.currencyCode)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {selectedDay ? (
        <>
          <View style={styles.dayHeader}>
            <View>
              <Text style={[styles.dayTitle, { color: theme.colors.text }]}>
                {formatShortDate(selectedDay.planDate)}
              </Text>
              <Text style={[styles.dayMeta, { color: theme.colors.textMuted }]}>
                {selectedDay.targetCalories} kcal · {formatMoney(selectedDay.estimatedCost, selectedDay.currencyCode)}
              </Text>
            </View>
            <View
              style={[
                styles.budgetPill,
                {
                  backgroundColor: budgetWarning ? theme.colors.warningSoft : theme.colors.successSoft,
                },
              ]}
            >
              <Text
                style={[
                  styles.budgetPillText,
                  { color: budgetWarning ? theme.colors.warning : theme.colors.success },
                ]}
              >
                {budgetWarning ? t('plan.budgetWarning') : t('budget.remaining')}
              </Text>
            </View>
          </View>

          {selectedDay.items.map(item => (
            <MealCard
              key={item.id}
              item={item}
              currencyCode={selectedDay.currencyCode}
              favorite={favorites.some(f => f.mealPlanItemId === item.id)}
              onPress={() => navigation.navigate('MealDetail', { dayId: selectedDay.id, itemId: item.id })}
              onToggleComplete={() => toggleMeal(item.id, !item.completionStatus)}
              onFavorite={() =>
                dispatch(
                  toggleFavorite({
                    userId,
                    mealPlanItemId: item.id,
                    name: item.foodName,
                    calories: item.calories,
                  }),
                )
              }
            />
          ))}

          {stalePrice ? (
            <View style={[styles.warning, { backgroundColor: theme.colors.warningSoft }]}>
              <Ionicons name="time-outline" size={16} color={theme.colors.warning} />
              <Text style={[styles.warningText, { color: theme.colors.warning }]}>{t('plan.priceStale')}</Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            <Button
              title={t('grocery.generate')}
              icon="cart-outline"
              variant="secondary"
              onPress={() => navigation.navigate('Grocery')}
            />
            <View style={styles.actionGap} />
            <Button
              title={t('plan.regenerate')}
              icon="refresh-outline"
              variant="outline"
              loading={busy}
              onPress={generate}
            />
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: { flexDirection: 'row', marginTop: 4, marginBottom: 12 },
  gap: { width: 8 },
  dayRow: { paddingVertical: 10, paddingRight: 8 },
  dayChip: {
    width: 70,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
    marginRight: 8,
  },
  dayName: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  dayNumber: { fontSize: 20, fontWeight: '800', marginVertical: 2 },
  dayCost: { fontSize: 9, fontWeight: '600' },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 12,
  },
  dayTitle: { fontSize: 19, fontWeight: '800' },
  dayMeta: { fontSize: 12, marginTop: 3 },
  budgetPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, maxWidth: 130 },
  budgetPillText: { fontSize: 9, fontWeight: '700', textAlign: 'center' },
  warning: { flexDirection: 'row', alignItems: 'center', padding: 11, borderRadius: 12, marginTop: 4 },
  warningText: { fontSize: 11, fontWeight: '600', marginLeft: 7, flex: 1, lineHeight: 16 },
  actions: { marginTop: 16 },
  actionGap: { height: 10 },
});
