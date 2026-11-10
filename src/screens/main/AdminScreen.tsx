import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import Screen from '../../components/common/Screen';
import ScreenHeader from '../../components/common/ScreenHeader';
import Card from '../../components/common/Card';
import StatTile from '../../components/common/StatTile';
import { useAppSelector } from '../../store/hooks';
import { isPriceStale } from '../../utils/budget';
import { useAppTheme } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Admin'>;

export default function AdminScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const { foods } = useAppSelector(state => state.data);

  const stats = useMemo(() => {
    const verified = foods.filter(food => food.verified).length;
    const withPrice = foods.filter(food => food.pricePerKg > 0).length;
    const stale = foods.filter(food => isPriceStale(food)).length;
    return { verified, withPrice, stale };
  }, [foods]);

  return (
    <Screen scroll>
      <ScreenHeader title={t('admin.title')} subtitle={t('admin.note')} onBack={() => navigation.goBack()} />

      <View style={[styles.notice, { backgroundColor: theme.colors.infoSoft }]}>
        <Ionicons name="shield-checkmark-outline" size={18} color={theme.colors.info} />
        <Text style={[styles.noticeText, { color: theme.colors.info }]}>{t('admin.note')}</Text>
      </View>

      <View style={styles.statsRow}>
        <StatTile icon="nutrition-outline" label={t('admin.foods')} value={String(foods.length)} />
        <View style={styles.gap} />
        <StatTile
          icon="checkmark-circle-outline"
          label={t('food.verified')}
          value={String(stats.verified)}
          color={theme.colors.success}
        />
      </View>
      <View style={styles.statsRow}>
        <StatTile
          icon="pricetag-outline"
          label={t('admin.prices')}
          value={String(stats.withPrice)}
          color={theme.colors.accent}
        />
        <View style={styles.gap} />
        <StatTile
          icon="time-outline"
          label={t('food.priceStale')}
          value={String(stats.stale)}
          color={theme.colors.warning}
        />
      </View>

      <Text style={[styles.section, { color: theme.colors.text }]}>{t('admin.foods')}</Text>
      {foods.slice(0, 20).map(food => (
        <Card key={food.id} style={styles.row}>
          <View style={styles.rowBody}>
            <Text style={[styles.name, { color: theme.colors.text }]}>{food.nameEn}</Text>
            <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
              {food.category} · {food.verified ? t('food.verified') : t('food.unverified')}
            </Text>
          </View>
          <Ionicons
            name={food.verified ? 'checkmark-circle' : 'alert-circle-outline'}
            size={18}
            color={food.verified ? theme.colors.success : theme.colors.warning}
          />
        </Card>
      ))}
      <Text style={[styles.disclaimer, { color: theme.colors.textMuted }]}>{t('admin.note')}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  notice: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, marginBottom: 14 },
  noticeText: { flex: 1, fontSize: 11, lineHeight: 16, fontWeight: '600', marginLeft: 8 },
  statsRow: { flexDirection: 'row', marginBottom: 9 },
  gap: { width: 9 },
  section: { fontSize: 16, fontWeight: '800', marginTop: 14, marginBottom: 9 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 7, paddingVertical: 11 },
  rowBody: { flex: 1 },
  name: { fontSize: 13, fontWeight: '700' },
  meta: { fontSize: 10, marginTop: 2 },
  disclaimer: { fontSize: 10, lineHeight: 15, marginTop: 14 },
});
