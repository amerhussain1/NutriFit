import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import Screen from '../../components/common/Screen';
import ScreenHeader from '../../components/common/ScreenHeader';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Chip from '../../components/common/Chip';
import EmptyState from '../../components/common/EmptyState';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { saveBudgetData } from '../../store/slices/dataSlice';
import { budgetSchema } from '../../utils/validation';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'EditBudget'>;

export default function EditBudgetScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { budget, profile } = useAppSelector(state => state.data);
  const session = useAppSelector(state => state.auth.session);
  const userId = session?.user.id ?? 'demo-user';
  const [period, setPeriod] = useState<'daily' | 'monthly'>(budget?.budgetPeriod ?? 'daily');
  const [amount, setAmount] = useState(String(budget?.amount ?? 800));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!profile) {
    return (
      <Screen>
        <ScreenHeader title={t('profile.editBudget')} onBack={() => navigation.goBack()} />
        <EmptyState icon="wallet-outline" title={t('common.notAvailable')} />
      </Screen>
    );
  }

  const currencyCode = budget?.currencyCode ?? (profile.countryCode === 'IN' ? 'INR' : 'PKR');

  const save = async () => {
    const parsed = budgetSchema.safeParse({
      budgetPeriod: period,
      amount,
      currencyCode,
      countryCode: profile.countryCode,
      city: profile.city,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'errors.invalidNumber');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await dispatch(
        saveBudgetData({
          userId,
          budget: {
            budgetPeriod: period,
            amount: parsed.data.amount,
            currencyCode,
            countryCode: profile.countryCode,
            city: profile.city,
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
      <ScreenHeader title={t('profile.editBudget')} subtitle={t('onboarding.budgetBody')} onBack={() => navigation.goBack()} />
      <View style={styles.chipRow}>
        <Chip label={t('onboarding.daily')} selected={period === 'daily'} onPress={() => setPeriod('daily')} />
        <Chip label={t('onboarding.monthly')} selected={period === 'monthly'} onPress={() => setPeriod('monthly')} />
      </View>
      <Input
        label={`${t('onboarding.budgetAmount')} (${currencyCode})`}
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
        error={error ? t(`errors.${error}`, { defaultValue: error }) : undefined}
      />
      <Button title={t('common.save')} loading={saving} onPress={save} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
});
