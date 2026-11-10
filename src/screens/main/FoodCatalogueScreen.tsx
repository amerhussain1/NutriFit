import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Screen from '../../components/common/Screen';
import ScreenHeader from '../../components/common/ScreenHeader';
import Input from '../../components/common/Input';
import Chip from '../../components/common/Chip';
import DemoBanner from '../../components/common/DemoBanner';
import EmptyState from '../../components/common/EmptyState';
import { useAppSelector } from '../../store/hooks';
import { formatMoney } from '../../utils/format';
import { isPriceStale } from '../../utils/budget';
import { useAppTheme } from '../../theme';
import type { FoodItem } from '../../types';
import type { MainTabNavigation } from '../../navigation/types';

function normalise(value: string): string {
  return value.toLowerCase().trim();
}

export default function FoodCatalogueScreen() {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<MainTabNavigation>();
  const { foods, profile, demo } = useAppSelector(state => state.data);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');

  const categories = useMemo(
    () => Array.from(new Set(foods.map(food => food.category))).sort(),
    [foods],
  );

  const filtered = useMemo(() => {
    const needle = normalise(query);
    return foods.filter(food => {
      if (category !== 'all' && food.category !== category) {
        return false;
      }
      if (!needle) {
        return true;
      }
      return [food.nameEn, food.nameUr ?? '', food.nameRomanUr ?? '', food.nameHi ?? '', food.canonicalName]
        .map(normalise)
        .some(name => name.includes(needle));
    });
  }, [foods, query, category]);

  const currency = profile?.countryCode === 'IN' ? 'INR' : 'PKR';

  const renderItem = ({ item }: { item: FoodItem }) => {
    const stale = isPriceStale(item);
    return (
      <Pressable
        onPress={() => navigation.navigate('FoodDetail', { foodId: item.id })}
        style={({ pressed }) => [
          styles.row,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <View style={[styles.foodIcon, { backgroundColor: theme.colors.primarySoft }]}>
          <Ionicons name="nutrition-outline" size={20} color={theme.colors.primary} />
        </View>
        <View style={styles.rowBody}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={1}>
              {item.nameEn}
            </Text>
            {item.verified ? (
              <Ionicons name="checkmark-circle" size={14} color={theme.colors.success} />
            ) : null}
          </View>
          <Text style={[styles.local, { color: theme.colors.textMuted }]} numberOfLines={1}>
            {[item.nameUr, item.nameRomanUr].filter(Boolean).join(' · ') || item.category}
          </Text>
          <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
            {item.caloriesPer100g} kcal · {item.proteinPer100g}g {t('home.protein')} · 100g
          </Text>
        </View>
        <View style={styles.priceCol}>
          <Text style={[styles.price, { color: theme.colors.text }]}>
            {item.pricePerKg > 0 ? formatMoney(item.pricePerKg, item.currencyCode || currency) : '—'}
          </Text>
          <Text style={[styles.priceUnit, { color: theme.colors.textMuted }]}>per kg</Text>
          {stale ? (
            <Text style={[styles.stale, { color: theme.colors.warning }]}>{t('food.priceStale')}</Text>
          ) : null}
        </View>
      </Pressable>
    );
  };

  return (
    <Screen padded={false}>
      <View style={styles.headerWrap}>
        <ScreenHeader title={t('food.title')} subtitle={t('food.searchPlaceholder')} />
        {demo ? <DemoBanner /> : null}
        <Input
          icon="search-outline"
          placeholder={t('food.searchPlaceholder')}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
          <Chip label={t('food.all')} selected={category === 'all'} onPress={() => setCategory('all')} />
          {categories.map(value => (
            <Chip
              key={value}
              label={value}
              selected={category === value}
              onPress={() => setCategory(value)}
            />
          ))}
        </ScrollView>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState icon="search-outline" title={t('food.noResults')} body={t('food.noResultsBody')} />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerWrap: { paddingHorizontal: 20 },
  categories: { paddingBottom: 8, paddingTop: 2 },
  list: { paddingHorizontal: 20, paddingBottom: 120, paddingTop: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 12,
    marginBottom: 9,
  },
  foodIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, marginLeft: 11 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 14, fontWeight: '700', marginRight: 5, flexShrink: 1 },
  local: { fontSize: 10, marginTop: 1 },
  meta: { fontSize: 10, marginTop: 3 },
  priceCol: { alignItems: 'flex-end', marginLeft: 6 },
  price: { fontSize: 13, fontWeight: '800' },
  priceUnit: { fontSize: 8, marginTop: 1 },
  stale: { fontSize: 7, fontWeight: '700', marginTop: 3, maxWidth: 70, textAlign: 'right' },
});
