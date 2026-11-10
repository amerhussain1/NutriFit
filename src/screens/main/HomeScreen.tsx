import React, { useMemo } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Screen from '../../components/common/Screen';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Avatar from '../../components/common/Avatar';
import DemoBanner from '../../components/common/DemoBanner';
import SectionHeader from '../../components/common/SectionHeader';
import StatTile from '../../components/common/StatTile';
import ProgressBar from '../../components/common/ProgressBar';
import CalorieRing from '../../components/cards/CalorieRing';
import MacroCard from '../../components/cards/MacroCard';
import MealCard from '../../components/cards/MealCard';
import FoodLogCard from '../../components/cards/FoodLogCard';
import EmptyState from '../../components/common/EmptyState';
import ErrorBanner from '../../components/common/ErrorBanner';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  addWater,
  createPlan,
  markMealCompleted,
  removeFoodLog,
  removeWater,
  setFoods,
  toggleFavorite,
} from '../../store/slices/dataSlice';
import { fetchFoods } from '../../services/data/api';
import { calculateDailyTargets } from '../../utils/nutrition';
import { formatMoney, isSameDay, toDateKey } from '../../utils/format';
import { formatWeight } from '../../utils/units';
import { useAppTheme } from '../../theme';
import type { MainTabNavigation } from '../../navigation/types';

export default function HomeScreen() {
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
    foodLogs,
    waterLogs,
    favorites,
    foods,
    demo,
    busy,
    error,
  } = useAppSelector(state => state.data);
  const session = useAppSelector(state => state.auth.session);
  const userId = session?.user.id ?? 'demo-user';

  const targets = useMemo(
    () => (profile && goal ? calculateDailyTargets(profile, goal) : null),
    [profile, goal],
  );

  const todayLogs = useMemo(
    () => foodLogs.filter(log => isSameDay(log.consumedAt, new Date())),
    [foodLogs],
  );
  const consumed = useMemo(
    () =>
      todayLogs.reduce(
        (acc, log) => ({
          calories: acc.calories + log.calories,
          protein: acc.protein + log.protein,
          carbs: acc.carbs + log.carbs,
          fat: acc.fat + log.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 },
      ),
    [todayLogs],
  );
  const todayWater = useMemo(
    () => waterLogs.filter(log => isSameDay(log.consumedAt, new Date())).reduce((sum, log) => sum + log.quantityMl, 0),
    [waterLogs],
  );

  const todayPlan = useMemo(() => {
    if (!plan) {
      return null;
    }
    return plan.days.find(day => day.planDate === toDateKey()) ?? plan.days[0] ?? null;
  }, [plan]);

  const dailyBudget = budget ? (budget.budgetPeriod === 'monthly' ? budget.amount / 30 : budget.amount) : 0;
  const completedMeals = todayPlan ? todayPlan.items.filter(item => item.completionStatus).length : 0;
  const totalMeals = todayPlan ? todayPlan.items.length : 0;

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
      await dispatch(
        createPlan({
          userId,
          profile,
          goal,
          preferences,
          budget,
          targets,
          foods: catalogue,
        }),
      ).unwrap();
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

  const isFavorite = (itemId: string) => favorites.some(f => f.mealPlanItemId === itemId);

  const handleFavorite = (item: { id: string; foodName: string; calories: number }) => {
    dispatch(
      toggleFavorite({
        userId,
        mealPlanItemId: item.id,
        name: item.foodName,
        calories: item.calories,
      }),
    );
  };

  const confirmDeleteLog = (id: string, foodName: string) => {
    Alert.alert(t('food.deleteLog'), `${foodName}\n\n${t('food.deleteLogBody')}`, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => dispatch(removeFoodLog({ userId, id })),
      },
    ]);
  };

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Avatar name={profile?.fullName} size={46} />
          <View style={styles.headerText}>
            <Text style={[styles.greeting, { color: theme.colors.text }]}>
              {t('home.greeting', { name: profile?.fullName?.split(' ')[0] ?? 'there' })}
            </Text>
            <Text style={[styles.date, { color: theme.colors.textMuted }]}>
              {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => navigation.navigate('ProfileTab')}
          hitSlop={8}
          style={[styles.settings, { backgroundColor: theme.colors.surface }]}
        >
          <Ionicons name="settings-outline" size={20} color={theme.colors.text} />
        </Pressable>
      </View>

      {demo ? <DemoBanner /> : null}
      <ErrorBanner message={error} />

      {targets ? (
        <Card elevated style={styles.energyCard}>
          <View style={styles.ringRow}>
            <CalorieRing consumed={consumed.calories} target={targets.calories} />
            <View style={styles.macroColumn}>
              <MacroCard label={t('home.protein')} value={consumed.protein} target={targets.protein} color={theme.colors.accent} />
              <View style={styles.macroGap} />
              <MacroCard label={t('home.carbs')} value={consumed.carbs} target={targets.carbs} color={theme.colors.warning} />
              <View style={styles.macroGap} />
              <MacroCard label={t('home.fat')} value={consumed.fat} target={targets.fat} color={theme.colors.info} />
            </View>
          </View>
        </Card>
      ) : null}

      <View style={styles.statsRow}>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('Budget')}
          style={styles.statPressable}
        >
          <StatTile
            icon="wallet-outline"
            label={t('home.budget')}
            value={formatMoney(dailyBudget, budget?.currencyCode ?? 'PKR')}
            hint={
              todayPlan
                ? `${t('home.spent')} ${formatMoney(todayPlan.estimatedCost, todayPlan.currencyCode)}`
                : undefined
            }
            color={theme.colors.accent}
          />
        </Pressable>
        <View style={styles.statGap} />
        <StatTile
          icon="barbell-outline"
          label={t('home.weight')}
          value={profile ? formatWeight(profile.weightKg, profile.units) : '—'}
          hint={goal ? t(`goal.${goal.goalType}`) : undefined}
        />
        <View style={styles.statGap} />
        <StatTile
          icon="checkmark-done-outline"
          label={t('home.todayPlan')}
          value={`${completedMeals}/${totalMeals}`}
          hint={plan ? t('plan.completed') : t('home.noPlan')}
          color={theme.colors.info}
        />
      </View>

      <SectionHeader
        title={t('water.title')}
        action={t('home.addWater')}
        onAction={() => dispatch(addWater({ userId, quantityMl: 250 }))}
      />
      <Card>
        <View style={styles.waterRow}>
          <View style={[styles.waterIcon, { backgroundColor: theme.colors.infoSoft }]}>
            <Ionicons name="water" size={22} color={theme.colors.info} />
          </View>
          <View style={styles.waterBody}>
            <Text style={[styles.waterValue, { color: theme.colors.text }]}>
              {todayWater} / {targets?.waterMl ?? 2500} ml
            </Text>
            <ProgressBar
              value={todayWater}
              max={targets?.waterMl ?? 2500}
              color={theme.colors.info}
              height={7}
            />
          </View>
        </View>
        <View style={styles.waterActions}>
          <Button title={t('water.add250')} size="sm" variant="secondary" fullWidth={false} onPress={() => dispatch(addWater({ userId, quantityMl: 250 }))} />
          <View style={styles.waterGap} />
          <Button title={t('water.add500')} size="sm" variant="secondary" fullWidth={false} onPress={() => dispatch(addWater({ userId, quantityMl: 500 }))} />
          <View style={styles.waterGap} />
          <Button title={t('water.remove')} size="sm" variant="ghost" fullWidth={false} onPress={() => dispatch(removeWater({ userId }))} />
        </View>
      </Card>

      <SectionHeader
        title={t('home.todayPlan')}
        action={plan ? t('home.viewPlan') : undefined}
        onAction={plan ? () => navigation.navigate('PlanTab') : undefined}
      />

      {!plan ? (
        <Card>
          <EmptyState
            icon="calendar-outline"
            title={t('home.noPlan')}
            body={t('home.noPlanBody')}
            actionTitle={t('home.generatePlan')}
            onAction={generate}
          />
        </Card>
      ) : (
        <>
          {todayPlan?.items.map(item => (
            <MealCard
              key={item.id}
              item={item}
              currencyCode={todayPlan.currencyCode}
              favorite={isFavorite(item.id)}
              onPress={() => navigation.navigate('MealDetail', { dayId: todayPlan.id, itemId: item.id })}
              onToggleComplete={() => toggleMeal(item.id, !item.completionStatus)}
              onFavorite={() => handleFavorite(item)}
            />
          ))}
          <Button
            title={t('home.generatePlan')}
            variant="outline"
            icon="refresh-outline"
            loading={busy}
            onPress={() =>
              Alert.alert(t('plan.regenerate'), t('plan.budgetWarning'), [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('common.confirm'), onPress: generate },
              ])
            }
          />
        </>
      )}

      <SectionHeader
        title={t('food.todayLog')}
        action={t('home.logFood')}
        onAction={() => navigation.navigate('FoodTab')}
      />
      {todayLogs.length === 0 ? (
        <Card>
          <Text style={[styles.emptyLog, { color: theme.colors.textMuted }]}>
            {t('food.noLogs')}
          </Text>
        </Card>
      ) : (
        todayLogs.map(log => (
          <FoodLogCard
            key={log.id}
            log={log}
            onPress={() => navigation.navigate('EditFoodLog', { logId: log.id })}
            onDelete={() => confirmDeleteLog(log.id, log.foodName)}
          />
        ))
      )}

      <SectionHeader title={t('budget.affordableSwaps')} />
      <View style={styles.quickRow}>
        <QuickAction
          icon="restaurant-outline"
          label={t('home.logFood')}
          onPress={() => navigation.navigate('FoodTab')}
        />
        <QuickAction
          icon="cart-outline"
          label={t('grocery.title')}
          onPress={() => navigation.navigate('Grocery')}
        />
        <QuickAction
          icon="trending-up-outline"
          label={t('home.updateWeight')}
          onPress={() => navigation.navigate('ProgressTab')}
        />
        <QuickAction
          icon="heart-outline"
          label={t('favorites.title')}
          onPress={() => navigation.navigate('Favorites')}
        />
      </View>
    </Screen>
  );
}

function QuickAction({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  const theme = useAppTheme();
  return (
    <Pressable onPress={onPress} style={styles.quick}>
      <View style={[styles.quickIcon, { backgroundColor: theme.colors.primarySoft }]}>
        <Ionicons name={icon} size={21} color={theme.colors.primary} />
      </View>
      <Text style={[styles.quickLabel, { color: theme.colors.text }]} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 14,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerText: { marginLeft: 11, flex: 1 },
  greeting: { fontSize: 21, fontWeight: '800' },
  date: { fontSize: 12, marginTop: 2 },
  settings: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  energyCard: { marginBottom: 14 },
  ringRow: { flexDirection: 'row', alignItems: 'center' },
  macroColumn: { flex: 1, marginLeft: 14 },
  macroGap: { height: 6 },
  statsRow: { flexDirection: 'row', marginBottom: 4 },
  statPressable: { flex: 1 },
  statGap: { width: 8 },
  waterRow: { flexDirection: 'row', alignItems: 'center' },
  waterIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  waterBody: { flex: 1 },
  waterValue: { fontSize: 14, fontWeight: '700', marginBottom: 7 },
  waterActions: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  waterGap: { width: 8 },
  emptyLog: { fontSize: 13, lineHeight: 19 },
  quickRow: { flexDirection: 'row', justifyContent: 'space-between' },
  quick: { flex: 1, alignItems: 'center', marginHorizontal: 3 },
  quickIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
  },
  quickLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
});
