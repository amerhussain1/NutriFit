import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import Screen from '../../components/common/Screen';
import ScreenHeader from '../../components/common/ScreenHeader';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import ErrorBanner from '../../components/common/ErrorBanner';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { replacePlanMeal } from '../../store/slices/dataSlice';
import { formatMoney } from '../../utils/format';
import { replacementCandidates, replaceMealItem } from '../../utils/plan';
import { useAppTheme } from '../../theme';
import type { ReplacementRequest } from '../../types';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ReplaceMeal'>;

const REASONS: { value: ReplacementRequest['reason']; labelKey: string; icon: string }[] = [
  { value: 'cheaper', labelKey: 'replace.cheaper', icon: 'cash-outline' },
  { value: 'higher_protein', labelKey: 'replace.higherProtein', icon: 'barbell-outline' },
  { value: 'vegetarian', labelKey: 'replace.vegetarian', icon: 'leaf-outline' },
  { value: 'quick', labelKey: 'replace.quick', icon: 'flash-outline' },
  { value: 'disliked', labelKey: 'replace.disliked', icon: 'thumbs-down-outline' },
  { value: 'unavailable', labelKey: 'replace.unavailable', icon: 'alert-circle-outline' },
];

export default function ReplaceMealScreen({ navigation, route }: Props) {
  const { dayId, itemId } = route.params;
  const theme = useAppTheme();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { plan, foods, busy, error } = useAppSelector(state => state.data);
  const session = useAppSelector(state => state.auth.session);
  const userId = session?.user.id ?? 'demo-user';
  const [reason, setReason] = useState<ReplacementRequest['reason']>('cheaper');

  const day = plan?.days.find(d => d.id === dayId);
  const item = day?.items.find(i => i.id === itemId);

  const candidates = useMemo(() => {
    if (!plan || !item) {
      return [];
    }
    return replacementCandidates({
      planItem: item,
      reason,
      foods,
      currencyCode: plan.currencyCode,
    })
      .map(food => ({ food, preview: replaceMealItem(item, food, reason) }))
      .sort((a, b) => a.preview.estimatedCost - b.preview.estimatedCost)
      .slice(0, 12);
  }, [plan, item, reason, foods]);

  if (!plan || !day || !item) {
    return (
      <Screen>
        <ScreenHeader title={t('replace.title')} onBack={() => navigation.goBack()} />
        <Text style={{ color: theme.colors.textMuted }}>{t('errors.unknown')}</Text>
      </Screen>
    );
  }

  const choose = async (foodId: string) => {
    try {
      await dispatch(
        replacePlanMeal({ userId, plan, itemId, reason, foodItemId: foodId }),
      ).unwrap();
      Alert.alert(t('replace.done'));
      navigation.goBack();
    } catch {
      // Error is surfaced from the store.
    }
  };

  return (
    <Screen scroll>
      <ScreenHeader title={t('replace.title')} subtitle={item.foodName} onBack={() => navigation.goBack()} />
      <ErrorBanner message={error} />

      <Text style={[styles.section, { color: theme.colors.text }]}>{t('plan.replace')}</Text>
      <View style={styles.reasons}>
        {REASONS.map(option => {
          const active = reason === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => setReason(option.value)}
              style={[
                styles.reason,
                {
                  backgroundColor: active ? theme.colors.primarySoft : theme.colors.surface,
                  borderColor: active ? theme.colors.primary : theme.colors.border,
                },
              ]}
            >
              <Ionicons
                name={option.icon}
                size={16}
                color={active ? theme.colors.primary : theme.colors.textMuted}
              />
              <Text
                style={[styles.reasonText, { color: active ? theme.colors.primary : theme.colors.text }]}
              >
                {t(option.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.section, { color: theme.colors.text }]}>{t('replace.select')}</Text>
      {candidates.length === 0 ? (
        <Card>
          <EmptyState icon="search-outline" title={t('replace.none')} />
        </Card>
      ) : (
        candidates.map(({ food, preview }) => {
          const savings = item.estimatedCost - preview.estimatedCost;
          return (
            <Pressable
              key={food.id}
              disabled={busy}
              onPress={() => choose(food.id)}
              style={({ pressed }) => [
                styles.candidate,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  opacity: pressed || busy ? 0.7 : 1,
                },
              ]}
            >
              <View style={styles.candidateBody}>
                <Text style={[styles.candidateName, { color: theme.colors.text }]}>{food.nameEn}</Text>
                <Text style={[styles.candidateMeta, { color: theme.colors.textMuted }]}>
                  {preview.calories} kcal · {preview.protein}g {t('home.protein')} ·{' '}
                  {formatMoney(preview.estimatedCost, plan.currencyCode)}
                </Text>
              </View>
              {savings > 0 ? (
                <View style={[styles.savings, { backgroundColor: theme.colors.successSoft }]}>
                  <Text style={[styles.savingsText, { color: theme.colors.success }]}>
                    -{formatMoney(savings, plan.currencyCode)}
                  </Text>
                </View>
              ) : (
                <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
              )}
            </Pressable>
          );
        })
      )}
      <Text style={[styles.disclaimer, { color: theme.colors.textMuted }]}>
        {t('plan.budgetWarning')}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { fontSize: 15, fontWeight: '800', marginTop: 14, marginBottom: 10 },
  reasons: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 },
  reason: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginRight: 8,
    marginBottom: 8,
  },
  reasonText: { fontSize: 11, fontWeight: '700', marginLeft: 5 },
  candidate: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    padding: 13,
    marginBottom: 9,
  },
  candidateBody: { flex: 1, paddingRight: 10 },
  candidateName: { fontSize: 14, fontWeight: '700' },
  candidateMeta: { fontSize: 10, marginTop: 3 },
  savings: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
  savingsText: { fontSize: 10, fontWeight: '800' },
  disclaimer: { fontSize: 10, lineHeight: 15, marginTop: 8 },
});
