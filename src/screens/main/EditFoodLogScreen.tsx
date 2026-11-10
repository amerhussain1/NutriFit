import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import Screen from '../../components/common/Screen';
import ScreenHeader from '../../components/common/ScreenHeader';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import SelectField from '../../components/forms/SelectField';
import EmptyState from '../../components/common/EmptyState';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { removeFoodLog, updateFoodLog } from '../../store/slices/dataSlice';
import { foodLogSchema } from '../../utils/validation';
import { scaleNutrition } from '../../utils/nutrition';
import { MEAL_TYPES } from '../../constants/options';
import type { MealType } from '../../types';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'EditFoodLog'>;

export default function EditFoodLogScreen({ navigation, route }: Props) {
  const { logId } = route.params;
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { foodLogs } = useAppSelector(state => state.data);
  const session = useAppSelector(state => state.auth.session);
  const userId = session?.user.id ?? 'demo-user';
  const log = foodLogs.find(entry => entry.id === logId);

  const [quantity, setQuantity] = useState(String(log?.quantityGrams ?? ''));
  const [mealType, setMealType] = useState<MealType>(log?.mealType ?? 'breakfast');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const mealOptions = useMemo(
    () => MEAL_TYPES.map(value => ({ value, label: t(`meal.${value}`) })),
    [t],
  );

  if (!log) {
    return (
      <Screen>
        <ScreenHeader title={t('food.editLog')} onBack={() => navigation.goBack()} />
        <EmptyState icon="restaurant-outline" title={t('common.notAvailable')} />
      </Screen>
    );
  }

  const save = async () => {
    const parsed = foodLogSchema.safeParse({ quantityGrams: quantity, mealType });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'errors.invalidNumber');
      return;
    }
    setError(null);
    setSaving(true);
    const nutrition = scaleNutrition(log, log.quantityGrams, parsed.data.quantityGrams);
    try {
      await dispatch(
        updateFoodLog({
          userId,
          log: {
            ...log,
            mealType: parsed.data.mealType,
            quantityGrams: parsed.data.quantityGrams,
            ...nutrition,
          },
        }),
      ).unwrap();
      navigation.goBack();
    } catch {
      Alert.alert(t('common.error'), t('errors.unknown'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(t('food.deleteLog'), t('food.deleteLogBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await dispatch(removeFoodLog({ userId, id: log.id })).unwrap();
            navigation.goBack();
          } catch {
            Alert.alert(t('common.error'), t('errors.unknown'));
          }
        },
      },
    ]);
  };

  return (
    <Screen scroll keyboard>
      <ScreenHeader
        title={t('food.editLog')}
        subtitle={log.foodName}
        onBack={() => navigation.goBack()}
      />
      <Input
        label={t('food.quantity')}
        keyboardType="decimal-pad"
        value={quantity}
        onChangeText={setQuantity}
        error={error ? t(`errors.${error}`, { defaultValue: error }) : undefined}
      />
      <SelectField
        label={t('food.mealCategory')}
        value={mealType}
        options={mealOptions}
        onChange={value => setMealType(value as MealType)}
      />
      <View style={styles.actions}>
        <Button title={t('common.save')} loading={saving} onPress={save} />
        <View style={styles.gap} />
        <Button
          title={t('common.delete')}
          icon="trash-outline"
          variant="danger"
          onPress={confirmDelete}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { marginTop: 8 },
  gap: { height: 10 },
});
