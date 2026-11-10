import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import Screen from '../../components/common/Screen';
import ScreenHeader from '../../components/common/ScreenHeader';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import SelectField from '../../components/forms/SelectField';
import EmptyState from '../../components/common/EmptyState';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { saveGoalData } from '../../store/slices/dataSlice';
import { goalSchema } from '../../utils/validation';
import { useAppTheme } from '../../theme';
import type { ActivityLevel, GoalType } from '../../types';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'EditGoal'>;

export default function EditGoalScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { goal, profile } = useAppSelector(state => state.data);
  const session = useAppSelector(state => state.auth.session);
  const userId = session?.user.id ?? 'demo-user';
  const [goalType, setGoalType] = useState<GoalType>(goal?.goalType ?? 'maintain');
  const [targetWeight, setTargetWeight] = useState(String(goal?.targetWeightKg ?? profile?.weightKg ?? 70));
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(goal?.activityLevel ?? 'moderate');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!profile) {
    return (
      <Screen>
        <ScreenHeader title={t('profile.editGoal')} onBack={() => navigation.goBack()} />
        <EmptyState icon="flag-outline" title={t('common.notAvailable')} />
      </Screen>
    );
  }

  const save = async () => {
    const parsed = goalSchema.safeParse({ goalType, targetWeightKg: targetWeight, activityLevel });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'errors.invalidNumber');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await dispatch(
        saveGoalData({
          userId,
          goal: {
            goalType,
            targetWeightKg: parsed.data.targetWeightKg,
            activityLevel,
            targetDate: goal?.targetDate ?? null,
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

  return (
    <Screen scroll keyboard>
      <ScreenHeader title={t('profile.editGoal')} subtitle={t('onboarding.goalBody')} onBack={() => navigation.goBack()} />
      <Text style={[styles.label, { color: theme.colors.textMuted }]}>{t('onboarding.goalTitle')}</Text>
      <View style={styles.goalRow}>
        {(['loss', 'gain', 'maintain'] as GoalType[]).map(type => (
          <Button
            key={type}
            title={t(`goal.${type}`)}
            size="sm"
            variant={goalType === type ? 'primary' : 'outline'}
            fullWidth={false}
            style={styles.goalButton}
            onPress={() => {
              setGoalType(type);
              if (type === 'loss') {
                setTargetWeight(String(Math.round(profile.weightKg * 0.92)));
              } else if (type === 'gain') {
                setTargetWeight(String(Math.round(profile.weightKg * 1.08)));
              } else {
                setTargetWeight(String(Math.round(profile.weightKg)));
              }
            }}
          />
        ))}
      </View>
      <Input
        label={`${t('onboarding.targetWeight')} (kg)`}
        keyboardType="decimal-pad"
        value={targetWeight}
        onChangeText={setTargetWeight}
        error={error ? t(`errors.${error}`, { defaultValue: error }) : undefined}
      />
      <SelectField
        label={t('onboarding.activity')}
        value={activityLevel}
        options={[
          { value: 'sedentary', label: t('activity.sedentary') },
          { value: 'light', label: t('activity.light') },
          { value: 'moderate', label: t('activity.moderate') },
          { value: 'active', label: t('activity.active') },
          { value: 'very_active', label: t('activity.veryActive') },
        ]}
        onChange={value => setActivityLevel(value as ActivityLevel)}
      />
      <Button title={t('common.save')} loading={saving} onPress={save} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  goalRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  goalButton: { marginRight: 8, marginBottom: 8 },
});
