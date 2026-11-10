import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import Screen from '../../components/common/Screen';
import ScreenHeader from '../../components/common/ScreenHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatTile from '../../components/common/StatTile';
import SectionHeader from '../../components/common/SectionHeader';
import EmptyState from '../../components/common/EmptyState';
import { useAppSelector } from '../../store/hooks';
import {
  dailyBudgetAmount,
  foodCost,
  isPriceStale,
  planTotalCost,
  weeklyGroceryEstimate,
} from '../../utils/budget';
import { isFoodAllowed } from '../../utils/plan';
import { formatDate, formatMoney } from '../../utils/format';
import { useAppTheme } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Budget'>;

export default function BudgetScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { budget, plan, foods, preferences, profile } = useAppSelector(state => state.data);

  const dailyBudget = budget ? dailyBudgetAmount(budget) : 0;
  const weeklyBudget = dailyBudget * 7;
  const plannedWeekly = plan ? weeklyGroceryEstimate(plan) : 0;
  const plannedDaily = plan && plan.days.length > 0 ? planTotalCost(plan) / plan.days.length : 0;
  const remainingDaily = Math.round((dailyBudget - plannedDaily) * 10) / 10;
  const overBudget = remainingDaily < 0;

  const planFoodIds = useMemo(
    () => new Set(plan?.days.flatMap(day => day.items.map(item => item.foodItemId)) ?? []),
    [plan],
  );

  const planFoods = useMemo(
    () => foods.filter(food => planFoodIds.has(food.id)),
    [foods, planFoodIds],
  );

  const latestPriceAt = useMemo(() => {
    const pool = planFoods.length > 0 ? planFoods : foods;
    const timestamps = pool
      .map(food => new Date(food.priceObservedAt).getTime())
      .filter(value => Number.isFinite(value));
    if (timestamps.length === 0) {
      return null;
    }
    return new Date(Math.max(...timestamps));
  }, [foods, planFoods]);

  const staleCount = useMemo(() => {
    const pool = planFoods.length > 0 ? planFoods : foods;
    return pool.filter(food => isPriceStale(food)).length;
  }, [foods, planFoods]);

  const swaps = useMemo(() => {
    if (!preferences) {
      return [];
    }
    return foods
      .filter(
        food =>
          food.pricePerKg > 0 &&
          !isPriceStale(food) &&
          !planFoodIds.has(food.id) &&
          isFoodAllowed(food, preferences),
      )
      .sort((a, b) => a.pricePerKg - b.pricePerKg)
      .slice(0, 5);
  }, [foods, planFoodIds, preferences]);

  const currencyCode = budget?.currencyCode ?? (profile?.countryCode === 'IN' ? 'INR' : 'PKR');

  if (!budget) {
    return (
      <Screen scroll>
        <ScreenHeader title={t('budget.title')} onBack={() => navigation.goBack()} />
        <Card>
          <EmptyState
            icon="wallet-outline"
            title={t('budget.setBudget')}
            body={t('budget.noBudgetBody')}
            actionTitle={t('budget.edit')}
            onAction={() => navigation.navigate('EditBudget')}
          />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <ScreenHeader
        title={t('budget.title')}
        subtitle={`${budget.city} · ${profile?.countryCode ?? budget.countryCode}`}
        onBack={() => navigation.goBack()}
        right={
          <Button
            title={t('common.edit')}
            icon="create-outline"
            size="sm"
            variant="ghost"
            fullWidth={false}
            onPress={() => navigation.navigate('EditBudget')}
          />
        }
      />

      <Card elevated>
        <Text style={[styles.kicker, { color: theme.colors.textMuted }]}>
          {budget.budgetPeriod === 'monthly' ? t('budget.monthlyBudget') : t('budget.dailyBudget')}
        </Text>
        <Text style={[styles.amount, { color: theme.colors.text }]}>
          {formatMoney(budget.amount, currencyCode)}
        </Text>
        {budget.budgetPeriod === 'monthly' ? (
          <Text style={[styles.equivalent, { color: theme.colors.textMuted }]}>
            {formatMoney(dailyBudget, currencyCode)} {t('common.perDay')}
          </Text>
        ) : null}

        <View style={styles.dividerRow}>
          <View style={styles.dividerItem}>
            <Text style={[styles.dividerLabel, { color: theme.colors.textMuted }]}>
              {t('budget.spent')}
            </Text>
            <Text style={[styles.dividerValue, { color: theme.colors.text }]}>
              {formatMoney(plannedDaily, currencyCode)}
            </Text>
          </View>
          <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
          <View style={styles.dividerItem}>
            <Text style={[styles.dividerLabel, { color: theme.colors.textMuted }]}>
              {t('budget.remaining')}
            </Text>
            <Text
              style={[
                styles.dividerValue,
                { color: overBudget ? theme.colors.danger : theme.colors.success },
              ]}
            >
              {formatMoney(remainingDaily, currencyCode)}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.statusPill,
            {
              backgroundColor: overBudget ? theme.colors.warningSoft : theme.colors.successSoft,
            },
          ]}
        >
          <Ionicons
            name={overBudget ? 'alert-circle-outline' : 'checkmark-circle-outline'}
            size={15}
            color={overBudget ? theme.colors.warning : theme.colors.success}
          />
          <Text
            style={[
              styles.statusText,
              { color: overBudget ? theme.colors.warning : theme.colors.success },
            ]}
          >
            {overBudget ? t('budget.overBudget') : t('budget.withinBudget')}
          </Text>
        </View>
      </Card>

      <View style={styles.statsRow}>
        <StatTile
          icon="calendar-outline"
          label={t('budget.weeklyBudget')}
          value={formatMoney(weeklyBudget, currencyCode)}
          color={theme.colors.info}
        />
        <View style={styles.statGap} />
        <StatTile
          icon="basket-outline"
          label={t('budget.weeklyGrocery')}
          value={formatMoney(plannedWeekly, currencyCode)}
          color={theme.colors.accent}
        />
      </View>

      <SectionHeader title={t('budget.locationPrices')} />
      <Card>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>
            {t('budget.city')}
          </Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>
            {budget.city}, {profile?.countryCode ?? budget.countryCode}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>
            {t('budget.lastUpdated')}
          </Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>
            {latestPriceAt ? formatDate(latestPriceAt) : t('common.notAvailable')}
          </Text>
        </View>
        {staleCount > 0 ? (
          <View style={[styles.warning, { backgroundColor: theme.colors.warningSoft }]}>
            <Ionicons name="time-outline" size={15} color={theme.colors.warning} />
            <Text style={[styles.warningText, { color: theme.colors.warning }]}>
              {t('budget.staleWarning')}
            </Text>
          </View>
        ) : null}
      </Card>

      <SectionHeader title={t('budget.affordableSwaps')} />
      {swaps.length === 0 ? (
        <Card>
          <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
            {t('budget.noPrices')}
          </Text>
        </Card>
      ) : (
        <Card padded={false}>
          {swaps.map((food, index) => (
            <View
              key={food.id}
              style={[
                styles.swapRow,
                index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border },
              ]}
            >
              <View style={[styles.swapIcon, { backgroundColor: theme.colors.primarySoft }]}>
                <Ionicons name="leaf-outline" size={18} color={theme.colors.primary} />
              </View>
              <View style={styles.swapBody}>
                <Text style={[styles.swapName, { color: theme.colors.text }]} numberOfLines={1}>
                  {food.nameEn}
                </Text>
                <Text style={[styles.swapMeta, { color: theme.colors.textMuted }]}>
                  {formatMoney(foodCost(food, 100), currencyCode)} · {t('food.per100g')}
                </Text>
              </View>
              <Button
                title={t('common.seeAll')}
                size="sm"
                variant="ghost"
                fullWidth={false}
                onPress={() => navigation.navigate('FoodDetail', { foodId: food.id })}
              />
            </View>
          ))}
        </Card>
      )}

      <View style={styles.actions}>
        <Button
          title={t('budget.edit')}
          icon="create-outline"
          variant="secondary"
          onPress={() => navigation.navigate('EditBudget')}
        />
        <View style={styles.actionGap} />
        <Button
          title={t('grocery.title')}
          icon="cart-outline"
          variant="outline"
          onPress={() => navigation.navigate('Grocery')}
        />
      </View>

      <Text style={[styles.disclaimer, { color: theme.colors.textMuted }]}>
        {t('budget.priceNote')}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  amount: { fontSize: 32, fontWeight: '800', marginTop: 4 },
  equivalent: { fontSize: 13, marginTop: 2 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 18 },
  dividerItem: { flex: 1 },
  dividerLine: { width: StyleSheet.hairlineWidth, height: 34, marginHorizontal: 12 },
  dividerLabel: { fontSize: 11, fontWeight: '600' },
  dividerValue: { fontSize: 17, fontWeight: '800', marginTop: 3 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 16,
  },
  statusText: { fontSize: 11, fontWeight: '700', marginLeft: 5, flexShrink: 1 },
  statsRow: { flexDirection: 'row', marginTop: 12 },
  statGap: { width: 8 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: { fontSize: 12, fontWeight: '600' },
  infoValue: { fontSize: 13, fontWeight: '700', flexShrink: 1, textAlign: 'right', marginLeft: 12 },
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 9,
    borderRadius: 10,
    marginTop: 10,
  },
  warningText: { fontSize: 10, fontWeight: '600', marginLeft: 6, flex: 1, lineHeight: 15 },
  emptyText: { fontSize: 13, lineHeight: 19 },
  swapRow: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  swapIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swapBody: { flex: 1, marginLeft: 11 },
  swapName: { fontSize: 14, fontWeight: '700' },
  swapMeta: { fontSize: 11, marginTop: 2 },
  actions: { marginTop: 22 },
  actionGap: { height: 10 },
  disclaimer: { fontSize: 10, lineHeight: 15, marginTop: 16 },
});
