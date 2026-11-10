import React, { useMemo } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import Screen from '../../components/common/Screen';
import ScreenHeader from '../../components/common/ScreenHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatTile from '../../components/common/StatTile';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  addFoodLog,
  markMealCompleted,
  toggleFavorite,
} from '../../store/slices/dataSlice';
import { formatMoney } from '../../utils/format';
import { isPriceStale } from '../../utils/budget';
import { useAppTheme } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'MealDetail'>;

export default function MealDetailScreen({ navigation, route }: Props) {
  const { dayId, itemId } = route.params;
  const theme = useAppTheme();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { plan, foods, favorites } = useAppSelector(state => state.data);
  const session = useAppSelector(state => state.auth.session);
  const userId = session?.user.id ?? 'demo-user';

  const day = plan?.days.find(d => d.id === dayId);
  const item = day?.items.find(i => i.id === itemId);
  const food = useMemo(() => foods.find(f => f.id === item?.foodItemId), [foods, item]);
  const favorite = favorites.some(f => f.mealPlanItemId === itemId);
  const stale = food ? isPriceStale(food) : true;

  if (!plan || !day || !item) {
    return (
      <Screen>
        <ScreenHeader title={t('plan.title')} onBack={() => navigation.goBack()} />
        <Text style={{ color: theme.colors.textMuted }}>{t('errors.unknown')}</Text>
      </Screen>
    );
  }

  const logMeal = async () => {
    await dispatch(
      addFoodLog({
        userId,
        log: {
          foodItemId: item.foodItemId,
          foodName: item.foodName,
          consumedAt: new Date().toISOString(),
          mealType: item.mealType,
          quantityGrams: item.quantityGrams,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
        },
      }),
    );
    dispatch(markMealCompleted({ userId, plan, itemId: item.id, completed: true }));
    Alert.alert(t('food.logged'), item.foodName);
  };

  return (
    <Screen scroll>
      <ScreenHeader
        title={item.foodName}
        subtitle={`${t(`meal.${item.mealType}`)} · ${item.quantityGrams}g`}
        onBack={() => navigation.goBack()}
      />

      <Card elevated>
        <View style={styles.headRow}>
          <View style={[styles.iconCircle, { backgroundColor: theme.colors.primarySoft }]}>
            <Ionicons name="restaurant" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.headText}>
            <Text style={[styles.calories, { color: theme.colors.text }]}>{item.calories} kcal</Text>
            <Text style={[styles.cost, { color: theme.colors.textMuted }]}>
              {t('plan.cost')}: {formatMoney(item.estimatedCost, day.currencyCode)} ({t('common.estimated')})
            </Text>
          </View>
          <Button
            title={favorite ? t('plan.unfavorite') : t('plan.favorite')}
            icon={favorite ? 'heart' : 'heart-outline'}
            variant="ghost"
            size="sm"
            fullWidth={false}
            onPress={() =>
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
        </View>
        <View style={styles.macroRow}>
          <StatTile label={t('home.protein')} value={`${item.protein}g`} color={theme.colors.accent} />
          <View style={styles.gap} />
          <StatTile label={t('home.carbs')} value={`${item.carbs}g`} color={theme.colors.warning} />
          <View style={styles.gap} />
          <StatTile label={t('home.fat')} value={`${item.fat}g`} color={theme.colors.info} />
        </View>
      </Card>

      <Text style={[styles.section, { color: theme.colors.text }]}>{t('plan.instructions')}</Text>
      <Card>
        <Text style={[styles.body, { color: theme.colors.textMuted }]}>
          {item.preparationInstructions || t('common.notAvailable')}
        </Text>
      </Card>

      <Text style={[styles.section, { color: theme.colors.text }]}>{t('plan.ingredients')}</Text>
      <Card>
        <View style={styles.ingredientRow}>
          <Text style={[styles.ingredient, { color: theme.colors.text }]}>{item.foodName}</Text>
          <Text style={[styles.ingredientQty, { color: theme.colors.textMuted }]}>{item.quantityGrams} g</Text>
        </View>
        <Text style={[styles.source, { color: theme.colors.textMuted }]}>
          {food ? `${t('food.source')}: ${food.sourceName}` : t('common.notAvailable')}
        </Text>
        {stale ? (
          <View style={[styles.warning, { backgroundColor: theme.colors.warningSoft }]}>
            <Ionicons name="time-outline" size={15} color={theme.colors.warning} />
            <Text style={[styles.warningText, { color: theme.colors.warning }]}>{t('plan.priceStale')}</Text>
          </View>
        ) : null}
      </Card>

      <View style={styles.actions}>
        <Button title={t('plan.replace')} icon="swap-horizontal" variant="outline" onPress={() => navigation.navigate('ReplaceMeal', { dayId, itemId })} />
        <View style={styles.actionGap} />
        <Button
          title={item.completionStatus ? t('plan.completed') : t('plan.markComplete')}
          icon="checkmark-circle-outline"
          variant="secondary"
          onPress={() =>
            dispatch(markMealCompleted({ userId, plan, itemId: item.id, completed: !item.completionStatus }))
          }
        />
        <View style={styles.actionGap} />
        <Button title={t('food.log')} icon="add-circle-outline" onPress={logMeal} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headText: { flex: 1, marginLeft: 12 },
  calories: { fontSize: 22, fontWeight: '800' },
  cost: { fontSize: 11, marginTop: 3 },
  macroRow: { flexDirection: 'row', marginTop: 16 },
  gap: { width: 8 },
  section: { fontSize: 16, fontWeight: '800', marginTop: 20, marginBottom: 9 },
  body: { fontSize: 13, lineHeight: 20 },
  ingredientRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ingredient: { fontSize: 14, fontWeight: '700', flex: 1 },
  ingredientQty: { fontSize: 13, fontWeight: '600' },
  source: { fontSize: 10, marginTop: 8 },
  warning: { flexDirection: 'row', alignItems: 'center', padding: 9, borderRadius: 10, marginTop: 10 },
  warningText: { fontSize: 10, fontWeight: '600', marginLeft: 6, flex: 1 },
  actions: { marginTop: 22 },
  actionGap: { height: 10 },
});
