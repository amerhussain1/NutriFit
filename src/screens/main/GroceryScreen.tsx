import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import Screen from '../../components/common/Screen';
import ScreenHeader from '../../components/common/ScreenHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import ProgressBar from '../../components/common/ProgressBar';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  createGroceryList,
  markGroceryPurchased,
} from '../../store/slices/dataSlice';
import { formatMoney } from '../../utils/format';
import { useAppTheme } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Grocery'>;

export default function GroceryScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { plan, foods, groceryList } = useAppSelector(state => state.data);
  const session = useAppSelector(state => state.auth.session);
  const userId = session?.user.id ?? 'demo-user';

  const build = async () => {
    if (!plan) {
      return;
    }
    await dispatch(createGroceryList({ userId, plan, foods }));
  };

  const purchased = groceryList?.items.filter(item => item.purchased).length ?? 0;
  const total = groceryList?.items.length ?? 0;
  const estimate = groceryList?.items.reduce((sum, item) => sum + item.estimatedCost, 0) ?? 0;
  const stale = groceryList?.items.some(item => item.priceStale) ?? false;

  return (
    <Screen scroll>
      <ScreenHeader title={t('grocery.title')} subtitle={t('grocery.estimate')} onBack={() => navigation.goBack()} />

      {!plan || !groceryList ? (
        <Card>
          <EmptyState
            icon="cart-outline"
            title={t('grocery.empty')}
            body={plan ? t('grocery.emptyBody') : t('home.noPlanBody')}
            actionTitle={plan ? t('grocery.generate') : t('plan.generate')}
            onAction={plan ? build : () => navigation.navigate('Main', { screen: 'PlanTab' })}
          />
        </Card>
      ) : (
        <>
          <Card elevated>
            <View style={styles.summaryRow}>
              <View>
                <Text style={[styles.total, { color: theme.colors.text }]}>
                  {formatMoney(estimate, plan.currencyCode)}
                </Text>
                <Text style={[styles.totalLabel, { color: theme.colors.textMuted }]}>
                  {t('grocery.estimate')}
                </Text>
              </View>
              <View style={[styles.countPill, { backgroundColor: theme.colors.successSoft }]}>
                <Text style={[styles.countText, { color: theme.colors.success }]}>
                  {purchased}/{total}
                </Text>
              </View>
            </View>
            <ProgressBar value={purchased} max={Math.max(1, total)} color={theme.colors.accent} height={7} />
            {stale ? (
              <View style={[styles.warning, { backgroundColor: theme.colors.warningSoft }]}>
                <Ionicons name="time-outline" size={15} color={theme.colors.warning} />
                <Text style={[styles.warningText, { color: theme.colors.warning }]}>{t('budget.staleWarning')}</Text>
              </View>
            ) : null}
          </Card>

          <View style={styles.listHeader}>
            <Text style={[styles.listTitle, { color: theme.colors.text }]}>{groceryList.title}</Text>
            <Button title={t('grocery.generate')} size="sm" variant="ghost" fullWidth={false} onPress={build} />
          </View>

          {groceryList.items.map(item => (
            <Card key={item.id} style={styles.item} onPress={() => undefined}>
              <View style={styles.itemRow}>
                <View
                  style={[
                    styles.check,
                    {
                      backgroundColor: item.purchased ? theme.colors.success : 'transparent',
                      borderColor: item.purchased ? theme.colors.success : theme.colors.borderStrong,
                    },
                  ]}
                >
                  {item.purchased ? <Ionicons name="checkmark" size={15} color="#FFFFFF" /> : null}
                </View>
                <View style={styles.itemBody}>
                  <Text
                    style={[
                      styles.itemName,
                      {
                        color: theme.colors.text,
                        textDecorationLine: item.purchased ? 'line-through' : 'none',
                      },
                    ]}
                  >
                    {item.name}
                  </Text>
                  <Text style={[styles.itemMeta, { color: theme.colors.textMuted }]}>
                    {item.quantityGrams} g · {formatMoney(item.estimatedCost, plan.currencyCode)}
                  </Text>
                </View>
                <Button
                  title={item.purchased ? t('grocery.purchased') : t('grocery.pending')}
                  size="sm"
                  variant={item.purchased ? 'secondary' : 'ghost'}
                  fullWidth={false}
                  onPress={() =>
                    dispatch(
                      markGroceryPurchased({
                        userId,
                        list: groceryList,
                        itemId: item.id,
                        purchased: !item.purchased,
                      }),
                    )
                  }
                />
              </View>
            </Card>
          ))}
          <Text style={[styles.disclaimer, { color: theme.colors.textMuted }]}>{t('budget.staleWarning')}</Text>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  total: { fontSize: 26, fontWeight: '800' },
  totalLabel: { fontSize: 11, marginTop: 2 },
  countPill: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  countText: { fontSize: 13, fontWeight: '800' },
  warning: { flexDirection: 'row', alignItems: 'center', padding: 9, borderRadius: 10, marginTop: 10 },
  warningText: { fontSize: 10, fontWeight: '600', marginLeft: 6, flex: 1 },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, marginBottom: 8 },
  listTitle: { fontSize: 16, fontWeight: '800', flex: 1 },
  item: { marginBottom: 8, paddingVertical: 10, paddingHorizontal: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  check: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  itemBody: { flex: 1 },
  itemName: { fontSize: 13, fontWeight: '700' },
  itemMeta: { fontSize: 10, marginTop: 2 },
  disclaimer: { fontSize: 10, lineHeight: 15, marginTop: 12 },
});
