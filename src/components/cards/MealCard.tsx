import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import type { MealPlanItem } from '../../types';
import { useAppTheme } from '../../theme';
import { formatMoney } from '../../utils/format';

type Props = {
  item: MealPlanItem;
  currencyCode: 'PKR' | 'INR';
  favorite?: boolean;
  onPress?: () => void;
  onToggleComplete?: () => void;
  onFavorite?: () => void;
};

const mealIcons: Record<string, string> = {
  breakfast: 'sunny-outline',
  lunch: 'restaurant-outline',
  dinner: 'moon-outline',
  snack: 'cafe-outline',
};

export default function MealCard({
  item,
  currencyCode,
  favorite,
  onPress,
  onToggleComplete,
  onFavorite,
}: Props) {
  const theme = useAppTheme();
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: item.completionStatus ? theme.colors.success : theme.colors.border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: theme.colors.primarySoft }]}>
        <Ionicons name={mealIcons[item.mealType] ?? 'restaurant-outline'} size={19} color={theme.colors.primary} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.kicker, { color: theme.colors.textMuted }]}>
          {t(`meal.${item.mealType}`)}
        </Text>
        <Text
          style={[
            styles.name,
            {
              color: theme.colors.text,
              textDecorationLine: item.completionStatus ? 'line-through' : 'none',
            },
          ]}
          numberOfLines={1}
        >
          {item.foodName}
        </Text>
        <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
          {item.quantityGrams}g · {item.calories} kcal · {formatMoney(item.estimatedCost, currencyCode)}
        </Text>
      </View>
      <View style={styles.actions}>
        {onToggleComplete ? (
          <Pressable onPress={onToggleComplete} hitSlop={8} style={styles.action}>
            <Ionicons
              name={item.completionStatus ? 'checkmark-circle' : 'ellipse-outline'}
              size={22}
              color={item.completionStatus ? theme.colors.success : theme.colors.textMuted}
            />
          </Pressable>
        ) : null}
        {onFavorite ? (
          <Pressable onPress={onFavorite} hitSlop={8} style={styles.action}>
            <Ionicons
              name={favorite ? 'heart' : 'heart-outline'}
              size={20}
              color={favorite ? theme.colors.danger : theme.colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, marginLeft: 12 },
  kicker: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  name: { fontSize: 15, fontWeight: '700', marginTop: 1 },
  meta: { fontSize: 11, marginTop: 3 },
  actions: { flexDirection: 'row', alignItems: 'center' },
  action: { padding: 4, marginLeft: 2 },
});
