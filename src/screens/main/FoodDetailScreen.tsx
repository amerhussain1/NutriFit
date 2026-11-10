import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import Screen from '../../components/common/Screen';
import ScreenHeader from '../../components/common/ScreenHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import SelectField from '../../components/forms/SelectField';
import StatTile from '../../components/common/StatTile';
import EmptyState from '../../components/common/EmptyState';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { addFoodLog, toggleFavorite } from '../../store/slices/dataSlice';
import { foodLogSchema } from '../../utils/validation';
import { nutritionForQuantity } from '../../utils/nutrition';
import { formatMoney, formatDate, titleCase } from '../../utils/format';
import { isPriceStale } from '../../utils/budget';
import { MEAL_TYPES } from '../../constants/options';
import { useAppTheme } from '../../theme';
import type { MealType } from '../../types';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'FoodDetail'>;

export default function FoodDetailScreen({ navigation, route }: Props) {
  const { foodId } = route.params;
  const theme = useAppTheme();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { foods, favorites } = useAppSelector(state => state.data);
  const session = useAppSelector(state => state.auth.session);
  const userId = session?.user.id ?? 'demo-user';
  const food = foods.find(f => f.id === foodId);
  const [quantity, setQuantity] = useState(() => (food ? String(food.servingGrams) : '100'));
  const [mealType, setMealType] = useState<MealType>('breakfast');
  const [quantityError, setQuantityError] = useState<string | null>(null);

  const favorite = favorites.some(f => f.foodItemId === foodId);
  const amount = Number(quantity) || 0;
  const nutrition = useMemo(
    () => (food ? nutritionForQuantity(food, amount) : { calories: 0, protein: 0, carbs: 0, fat: 0 }),
    [food, amount],
  );

  if (!food) {
    return (
      <Screen>
        <ScreenHeader title={t('food.title')} onBack={() => navigation.goBack()} />
        <EmptyState icon="nutrition-outline" title={t('food.noResults')} />
      </Screen>
    );
  }

  const stale = isPriceStale(food);

  const log = async () => {
    const parsed = foodLogSchema.safeParse({ quantityGrams: quantity, mealType });
    if (!parsed.success) {
      setQuantityError(parsed.error.issues[0]?.message ?? 'errors.invalidNumber');
      return;
    }
    setQuantityError(null);
    await dispatch(
      addFoodLog({
        userId,
        log: {
          foodItemId: food.id,
          foodName: food.nameEn,
          consumedAt: new Date().toISOString(),
          mealType,
          quantityGrams: parsed.data.quantityGrams,
          calories: nutrition.calories,
          protein: nutrition.protein,
          carbs: nutrition.carbs,
          fat: nutrition.fat,
        },
      }),
    );
    Alert.alert(t('food.logged'), `${food.nameEn} · ${nutrition.calories} kcal`);
  };

  return (
    <Screen scroll>
      <ScreenHeader
        title={food.nameEn}
        subtitle={[food.nameUr, food.nameRomanUr].filter(Boolean).join(' · ') || food.category}
        onBack={() => navigation.goBack()}
        right={
          <Button
            title=""
            icon={favorite ? 'heart' : 'heart-outline'}
            variant="ghost"
            size="sm"
            fullWidth={false}
            onPress={() =>
              dispatch(
                toggleFavorite({
                  userId,
                  foodItemId: food.id,
                  name: food.nameEn,
                  calories: food.caloriesPer100g,
                }),
              )
            }
          />
        }
      />

      <Card elevated>
        <View style={styles.titleRow}>
          <View style={[styles.iconCircle, { backgroundColor: theme.colors.primarySoft }]}>
            <Ionicons name="nutrition" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.titleText}>
            <Text style={[styles.calories, { color: theme.colors.text }]}>
              {food.caloriesPer100g} kcal <Text style={styles.per}>{t('food.per100g')}</Text>
            </Text>
            <Text style={[styles.serving, { color: theme.colors.textMuted }]}>
              {food.servingName} · {food.servingGrams}g
            </Text>
          </View>
        </View>
        <View style={styles.macroRow}>
          <StatTile label={t('home.protein')} value={`${food.proteinPer100g}g`} color={theme.colors.accent} />
          <View style={styles.gap} />
          <StatTile label={t('home.carbs')} value={`${food.carbsPer100g}g`} color={theme.colors.warning} />
          <View style={styles.gap} />
          <StatTile label={t('home.fat')} value={`${food.fatPer100g}g`} color={theme.colors.info} />
        </View>
      </Card>

      <Text style={[styles.section, { color: theme.colors.text }]}>{t('food.quantity')}</Text>
      <Card>
        <Input
          keyboardType="decimal-pad"
          value={quantity}
          onChangeText={setQuantity}
          suffix="g"
          error={quantityError ? t(`errors.${quantityError}`, { defaultValue: quantityError }) : undefined}
        />
        <SelectField
          label={t('food.mealCategory')}
          value={mealType}
          options={MEAL_TYPES.map(type => ({ value: type, label: t(`meal.${type}`) }))}
          onChange={value => setMealType(value as MealType)}
        />
        <View style={styles.logSummary}>
          <Text style={[styles.logSummaryLabel, { color: theme.colors.textMuted }]}>
            {nutrition.calories} kcal · {nutrition.protein}g {t('home.protein')} ·{' '}
            {formatMoney(food.pricePerKg * (amount / 1000), food.currencyCode)}
          </Text>
          <Button title={t('food.log')} icon="add-circle-outline" onPress={log} />
        </View>
      </Card>

      <Text style={[styles.section, { color: theme.colors.text }]}>{t('budget.title')}</Text>
      <Card>
        <InfoRow
          label={t('food.per100g')}
          value={`${formatMoney(food.pricePerKg, food.currencyCode)} / kg`}
        />
        <InfoRow label={t('food.source')} value={food.sourceName} />
        <InfoRow
          label={t('budget.lastUpdated')}
          value={food.priceObservedAt ? formatDate(food.priceObservedAt) : t('common.notAvailable')}
        />
        <InfoRow
          label={t('food.verified')}
          value={food.verified ? t('food.verified') : t('food.unverified')}
          valueColor={food.verified ? theme.colors.success : theme.colors.warning}
        />
        {stale ? (
          <View style={[styles.warning, { backgroundColor: theme.colors.warningSoft }]}>
            <Ionicons name="time-outline" size={15} color={theme.colors.warning} />
            <Text style={[styles.warningText, { color: theme.colors.warning }]}>{t('food.priceStale')}</Text>
          </View>
        ) : null}
      </Card>

      <Text style={[styles.section, { color: theme.colors.text }]}>{t('food.all')}</Text>
      <View style={styles.tags}>
        {[...food.dietaryTags, ...food.allergenTags].map(tag => (
          <View key={`${food.id}-${tag}`} style={[styles.tag, { backgroundColor: theme.colors.surfaceAlt }]}>
            <Text style={[styles.tagText, { color: theme.colors.textMuted }]}>{titleCase(String(tag))}</Text>
          </View>
        ))}
      </View>
      {food.instructions ? (
        <Text style={[styles.body, { color: theme.colors.textMuted }]}>{food.instructions}</Text>
      ) : null}
      <Text style={[styles.disclaimer, { color: theme.colors.textMuted }]}>
        {t('food.unverified')}
      </Text>
    </Screen>
  );
}

function InfoRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  const theme = useAppTheme();
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: valueColor ?? theme.colors.text }]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: { flex: 1, marginLeft: 12 },
  calories: { fontSize: 21, fontWeight: '800' },
  per: { fontSize: 11, fontWeight: '600' },
  serving: { fontSize: 11, marginTop: 3 },
  macroRow: { flexDirection: 'row', marginTop: 16 },
  gap: { width: 8 },
  section: { fontSize: 16, fontWeight: '800', marginTop: 20, marginBottom: 9 },
  logSummary: { marginTop: 4 },
  logSummaryLabel: { fontSize: 11, fontWeight: '600', marginBottom: 12, textAlign: 'center' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  infoLabel: { fontSize: 12, fontWeight: '600' },
  infoValue: { fontSize: 12, fontWeight: '700', maxWidth: '62%', textAlign: 'right' },
  warning: { flexDirection: 'row', alignItems: 'center', padding: 9, borderRadius: 10, marginTop: 10 },
  warningText: { fontSize: 10, fontWeight: '600', marginLeft: 6, flex: 1 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  tag: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, marginRight: 6, marginBottom: 6 },
  tagText: { fontSize: 9, fontWeight: '700' },
  body: { fontSize: 12, lineHeight: 18, marginTop: 4 },
  disclaimer: { fontSize: 10, lineHeight: 15, marginTop: 14 },
});
