import React, { useState } from 'react';
import { Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import Screen from '../../components/common/Screen';
import ScreenHeader from '../../components/common/ScreenHeader';
import Button from '../../components/common/Button';
import SelectField from '../../components/forms/SelectField';
import MultiSelectChips from '../../components/forms/MultiSelectChips';
import TagInput from '../../components/forms/TagInput';
import EmptyState from '../../components/common/EmptyState';
import { ALLERGY_OPTIONS, COOKING_CONSTRAINTS, DIET_OPTIONS } from '../../constants/options';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { savePreferencesData } from '../../store/slices/dataSlice';
import { preferencesSchema } from '../../utils/validation';
import { titleCase } from '../../utils/format';
import type { DietType } from '../../types';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'EditPreferences'>;

export default function EditPreferencesScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { preferences, profile } = useAppSelector(state => state.data);
  const session = useAppSelector(state => state.auth.session);
  const userId = session?.user.id ?? 'demo-user';
  const [dietType, setDietType] = useState<DietType>(preferences?.dietType ?? 'non_vegetarian');
  const [allergies, setAllergies] = useState<string[]>(preferences?.allergies ?? []);
  const [excluded, setExcluded] = useState<string[]>(preferences?.excludedIngredients ?? []);
  const [disliked, setDisliked] = useState<string[]>(preferences?.dislikedFoods ?? []);
  const [preferred, setPreferred] = useState<string[]>(preferences?.preferredFoods ?? []);
  const [cooking, setCooking] = useState<string[]>(preferences?.cookingConstraints ?? []);
  const [saving, setSaving] = useState(false);

  if (!profile) {
    return (
      <Screen>
        <ScreenHeader title={t('profile.editPreferences')} onBack={() => navigation.goBack()} />
        <EmptyState icon="options-outline" title={t('common.notAvailable')} />
      </Screen>
    );
  }

  const save = async () => {
    const parsed = preferencesSchema.safeParse({
      dietType,
      allergies,
      excludedIngredients: excluded,
      dislikedFoods: disliked,
      preferredFoods: preferred,
      cookingConstraints: cooking,
      mealSchedule: preferences?.mealSchedule ?? ['breakfast', 'lunch', 'dinner', 'snack'],
    });
    if (!parsed.success) {
      Alert.alert(t('common.error'), t('errors.unknown'));
      return;
    }
    setSaving(true);
    try {
      await dispatch(savePreferencesData({ userId, preferences: parsed.data })).unwrap();
      navigation.goBack();
    } catch {
      Alert.alert(t('common.error'), t('errors.unknown'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll keyboard>
      <ScreenHeader title={t('profile.editPreferences')} subtitle={t('onboarding.preferencesBody')} onBack={() => navigation.goBack()} />
      <SelectField
        label={t('onboarding.dietType')}
        value={dietType}
        options={DIET_OPTIONS.map(o => ({ value: o.value, label: t(o.labelKey) }))}
        onChange={value => setDietType(value as DietType)}
      />
      <MultiSelectChips
        label={t('onboarding.allergies')}
        selected={allergies}
        options={ALLERGY_OPTIONS.map(value => ({ value, label: titleCase(value) }))}
        onChange={setAllergies}
      />
      <TagInput label={t('onboarding.excluded')} values={excluded} onChange={setExcluded} placeholder="e.g. onion" />
      <TagInput label={t('onboarding.disliked')} values={disliked} onChange={setDisliked} placeholder="e.g. bitter gourd" />
      <TagInput label={t('onboarding.preferred')} values={preferred} onChange={setPreferred} placeholder="e.g. daal" />
      <MultiSelectChips
        label={t('onboarding.cooking')}
        selected={cooking}
        options={COOKING_CONSTRAINTS.map(value => ({ value, label: titleCase(value) }))}
        onChange={setCooking}
      />
      <Button title={t('common.save')} loading={saving} onPress={save} />
    </Screen>
  );
}
