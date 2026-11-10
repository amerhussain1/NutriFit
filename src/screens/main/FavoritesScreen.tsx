import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import Screen from '../../components/common/Screen';
import ScreenHeader from '../../components/common/ScreenHeader';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { toggleFavorite } from '../../store/slices/dataSlice';
import { formatDate } from '../../utils/format';
import { useAppTheme } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Favorites'>;

export default function FavoritesScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { favorites, plan } = useAppSelector(state => state.data);
  const session = useAppSelector(state => state.auth.session);
  const userId = session?.user.id ?? 'demo-user';

  const open = (favorite: (typeof favorites)[number]) => {
    if (favorite.foodItemId) {
      navigation.navigate('FoodDetail', { foodId: favorite.foodItemId });
      return;
    }
    if (favorite.mealPlanItemId && plan) {
      const day = plan.days.find(d => d.items.some(item => item.id === favorite.mealPlanItemId));
      if (day) {
        navigation.navigate('MealDetail', { dayId: day.id, itemId: favorite.mealPlanItemId });
      }
    }
  };

  return (
    <Screen scroll>
      <ScreenHeader title={t('favorites.title')} onBack={() => navigation.goBack()} />
      {favorites.length === 0 ? (
        <Card>
          <EmptyState
            icon="heart-outline"
            title={t('favorites.empty')}
            body={t('favorites.emptyBody')}
            actionTitle={t('food.title')}
            onAction={() => navigation.navigate('Main', { screen: 'FoodTab' })}
          />
        </Card>
      ) : (
        favorites.map(favorite => (
          <Card key={favorite.id} style={styles.card} onPress={() => open(favorite)}>
            <View style={styles.row}>
              <View style={[styles.icon, { backgroundColor: theme.colors.dangerSoft }]}>
                <Ionicons name="heart" size={18} color={theme.colors.danger} />
              </View>
              <View style={styles.body}>
                <Text style={[styles.name, { color: theme.colors.text }]}>{favorite.name}</Text>
                <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
                  {favorite.calories ? `${favorite.calories} kcal · ` : ''}
                  {formatDate(favorite.createdAt)}
                </Text>
              </View>
              <Pressable
                onPress={() =>
                  dispatch(
                    toggleFavorite({
                      userId,
                      foodItemId: favorite.foodItemId ?? undefined,
                      mealPlanItemId: favorite.mealPlanItemId ?? undefined,
                      name: favorite.name,
                      calories: favorite.calories,
                    }),
                  )
                }
                style={styles.remove}
              >
                <Ionicons name="trash-outline" size={18} color={theme.colors.danger} />
              </Pressable>
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 9 },
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, marginLeft: 11 },
  name: { fontSize: 14, fontWeight: '700' },
  meta: { fontSize: 10, marginTop: 3 },
  remove: { padding: 8 },
});
