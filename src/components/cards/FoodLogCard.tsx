import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import type { FoodLog } from '../../types';
import { useAppTheme } from '../../theme';
import { formatTime } from '../../utils/format';

type Props = {
  log: FoodLog;
  onPress: () => void;
  onDelete: () => void;
};

const mealIcons: Record<string, string> = {
  breakfast: 'sunny-outline',
  lunch: 'restaurant-outline',
  dinner: 'moon-outline',
  snack: 'cafe-outline',
};

export default function FoodLogCard({ log, onPress, onDelete }: Props) {
  const theme = useAppTheme();
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: theme.colors.infoSoft }]}>
        <Ionicons
          name={mealIcons[log.mealType] ?? 'restaurant-outline'}
          size={18}
          color={theme.colors.info}
        />
      </View>
      <View style={styles.body}>
        <Text style={[styles.kicker, { color: theme.colors.textMuted }]}>
          {t(`meal.${log.mealType}`)} · {formatTime(log.consumedAt)}
        </Text>
        <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={1}>
          {log.foodName}
        </Text>
        <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
          {log.quantityGrams}g · {log.calories} kcal · {t('home.protein')} {log.protein}g
        </Text>
      </View>
      <Pressable onPress={onDelete} hitSlop={8} style={styles.action}>
        <Ionicons name="trash-outline" size={19} color={theme.colors.danger} />
      </Pressable>
      <Ionicons name="chevron-forward" size={17} color={theme.colors.textMuted} />
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
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, marginLeft: 11 },
  kicker: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  name: { fontSize: 14, fontWeight: '700', marginTop: 1 },
  meta: { fontSize: 11, marginTop: 3 },
  action: { padding: 6, marginRight: 2 },
});
