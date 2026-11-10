import React, { useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LineChart } from 'react-native-gifted-charts';
import { useTranslation } from 'react-i18next';
import Screen from '../../components/common/Screen';
import ScreenHeader from '../../components/common/ScreenHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import StatTile from '../../components/common/StatTile';
import ProgressBar from '../../components/common/ProgressBar';
import EmptyState from '../../components/common/EmptyState';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { addWeight } from '../../store/slices/dataSlice';
import { weightSchema } from '../../utils/validation';
import { formatDate, clamp } from '../../utils/format';
import { formatWeight as formatWeightUnit } from '../../utils/units';
import { useAppTheme } from '../../theme';

export default function ProgressScreen() {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { profile, goal, weightLogs } = useAppSelector(state => state.data);
  const session = useAppSelector(state => state.auth.session);
  const userId = session?.user.id ?? 'demo-user';
  const [modalOpen, setModalOpen] = useState(false);
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const units = profile?.units ?? 'metric';
  const chartData = useMemo(() => {
    const entries = weightLogs.slice(-14);
    return entries.map((entry, index) => ({
      value: units === 'imperial' ? Math.round(entry.weightKg * 2.20462 * 10) / 10 : entry.weightKg,
      label:
        index === 0 || index === entries.length - 1
          ? new Date(entry.measuredAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
          : '',
    }));
  }, [weightLogs, units]);

  const startWeight = weightLogs[0]?.weightKg ?? profile?.weightKg ?? 0;
  const currentWeight = weightLogs[weightLogs.length - 1]?.weightKg ?? profile?.weightKg ?? 0;
  const targetWeight = goal?.targetWeightKg ?? currentWeight;
  const change = Math.round((currentWeight - startWeight) * 10) / 10;

  const goalProgress = useMemo(() => {
    if (!goal || startWeight === targetWeight) {
      return 0;
    }
    if (goal.goalType === 'loss') {
      return clamp((startWeight - currentWeight) / (startWeight - targetWeight), 0, 1);
    }
    if (goal.goalType === 'gain') {
      return clamp((currentWeight - startWeight) / (targetWeight - startWeight), 0, 1);
    }
    return clamp(1 - Math.abs(currentWeight - targetWeight) / Math.max(1, targetWeight), 0, 1);
  }, [goal, startWeight, currentWeight, targetWeight]);

  const openModal = () => {
    const value = units === 'imperial' ? Math.round(currentWeight * 2.20462 * 10) / 10 : currentWeight;
    setWeight(String(value));
    setNotes('');
    setError(null);
    setModalOpen(true);
  };

  const save = async () => {
    const raw = Number(weight);
    const kg = units === 'imperial' ? raw / 2.20462 : raw;
    const parsed = weightSchema.safeParse({ weightKg: kg, notes });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'errors.invalidNumber');
      return;
    }
    await dispatch(
      addWeight({ userId, weightKg: Math.round(parsed.data.weightKg * 10) / 10, notes: parsed.data.notes }),
    );
    setModalOpen(false);
    Alert.alert(t('progress.addWeight'));
  };

  const chartWidth = Dimensions.get('window').width - 96;

  return (
    <Screen scroll>
      <ScreenHeader
        title={t('progress.title')}
        subtitle={t('progress.disclaimer')}
        right={
          <Pressable
            onPress={openModal}
            style={[styles.addButton, { backgroundColor: theme.colors.primarySoft }]}
          >
            <Ionicons name="add" size={20} color={theme.colors.primary} />
          </Pressable>
        }
      />

      <View style={styles.statsRow}>
        <StatTile
          icon="barbell-outline"
          label={t('progress.current')}
          value={profile ? formatWeightUnit(currentWeight, units) : '—'}
        />
        <View style={styles.gap} />
        <StatTile
          icon="flag-outline"
          label={t('progress.target')}
          value={formatWeightUnit(targetWeight, units)}
          color={theme.colors.accent}
        />
        <View style={styles.gap} />
        <StatTile
          icon={change <= 0 ? 'trending-down-outline' : 'trending-up-outline'}
          label={t('progress.change')}
          value={`${change > 0 ? '+' : ''}${Math.round(change * 10) / 10} kg`}
          color={theme.colors.info}
        />
      </View>

      {goal ? (
        <Card style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{t('progress.goalProgress')}</Text>
            <Text style={[styles.progressPercent, { color: theme.colors.primary }]}>
              {Math.round(goalProgress * 100)}%
            </Text>
          </View>
          <ProgressBar value={goalProgress} max={1} color={theme.colors.accent} height={9} />
          <Text style={[styles.goalMeta, { color: theme.colors.textMuted }]}>
            {formatWeightUnit(startWeight, units)} → {formatWeightUnit(targetWeight, units)} ·{' '}
            {t(`goal.${goal.goalType}`)}
          </Text>
        </Card>
      ) : null}

      <Card style={styles.chartCard}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{t('progress.weightHistory')}</Text>
        {chartData.length === 0 ? (
          <EmptyState
            icon="analytics-outline"
            title={t('progress.noData')}
            body={t('progress.noDataBody')}
            actionTitle={t('progress.addWeight')}
            onAction={openModal}
          />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chartScroll}>
            <LineChart
              data={chartData}
              width={chartWidth}
              height={170}
              color={theme.colors.primary}
              thickness={3}
              areaChart
              startFillColor={theme.colors.primary}
              startOpacity={0.22}
              endFillColor={theme.colors.primary}
              endOpacity={0.01}
              hideDataPoints={chartData.length > 8}
              dataPointsColor={theme.colors.primary}
              dataPointsRadius={4}
              yAxisTextStyle={{ color: theme.colors.textMuted, fontSize: 9 }}
              xAxisLabelTextStyle={{ color: theme.colors.textMuted, fontSize: 9 }}
              rulesColor={theme.colors.border}
              yAxisColor={theme.colors.border}
              xAxisColor={theme.colors.border}
              noOfSections={4}
              spacing={Math.max(36, (chartWidth - 30) / Math.max(1, chartData.length - 1))}
              initialSpacing={16}
              adjustToWidth
            />
          </ScrollView>
        )}
      </Card>

      <Text style={[styles.section, { color: theme.colors.text }]}>{t('progress.weightHistory')}</Text>
      {weightLogs.length === 0 ? (
        <Card>
          <EmptyState
            icon="scale-outline"
            title={t('progress.noData')}
            body={t('progress.noDataBody')}
            actionTitle={t('progress.addWeight')}
            onAction={openModal}
          />
        </Card>
      ) : (
        <Card>
          {weightLogs
            .slice()
            .reverse()
            .slice(0, 8)
            .map((entry, index) => (
              <View
                key={entry.id}
                style={[
                  styles.logRow,
                  index !== 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border },
                ]}
              >
                <View style={styles.logLeft}>
                  <View style={[styles.dot, { backgroundColor: theme.colors.accent }]} />
                  <View>
                    <Text style={[styles.logWeight, { color: theme.colors.text }]}>
                      {formatWeightUnit(entry.weightKg, units)}
                    </Text>
                    <Text style={[styles.logDate, { color: theme.colors.textMuted }]}>
                      {formatDate(entry.measuredAt)}
                    </Text>
                  </View>
                </View>
                {entry.notes ? (
                  <Text style={[styles.logNotes, { color: theme.colors.textMuted }]} numberOfLines={1}>
                    {entry.notes}
                  </Text>
                ) : null}
              </View>
            ))}
        </Card>
      )}

      <Text style={[styles.disclaimer, { color: theme.colors.textMuted }]}>{t('progress.disclaimer')}</Text>

      <Modal transparent visible={modalOpen} animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
          <Pressable style={styles.overlayDismiss} onPress={() => setModalOpen(false)} />
          <View style={[styles.sheet, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.handle} />
            <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>{t('progress.addWeight')}</Text>
            <Input
              label={`${t('home.weight')} (${units === 'imperial' ? 'lb' : 'kg'})`}
              keyboardType="decimal-pad"
              value={weight}
              onChangeText={setWeight}
              error={error ? t(`errors.${error}`, { defaultValue: error }) : undefined}
            />
            <Input label={t('common.optional')} value={notes} onChangeText={setNotes} placeholder={t('common.optional')} />
            <Button title={t('common.save')} onPress={save} />
            <Button title={t('common.cancel')} variant="ghost" onPress={() => setModalOpen(false)} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: { flexDirection: 'row', marginBottom: 14 },
  gap: { width: 8 },
  goalCard: { marginBottom: 14 },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 15, fontWeight: '800' },
  progressPercent: { fontSize: 16, fontWeight: '800' },
  goalMeta: { fontSize: 10, marginTop: 8, fontWeight: '600' },
  chartCard: { marginBottom: 6 },
  chartScroll: { paddingTop: 20, paddingBottom: 4 },
  section: { fontSize: 16, fontWeight: '800', marginTop: 18, marginBottom: 9 },
  logRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  logLeft: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 9, height: 9, borderRadius: 5, marginRight: 10 },
  logWeight: { fontSize: 14, fontWeight: '700' },
  logDate: { fontSize: 10, marginTop: 2 },
  logNotes: { fontSize: 10, maxWidth: '42%', textAlign: 'right' },
  disclaimer: { fontSize: 10, lineHeight: 15, marginTop: 14 },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  overlayDismiss: { flex: 1 },
  sheet: { borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: 34 },
  handle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
});
