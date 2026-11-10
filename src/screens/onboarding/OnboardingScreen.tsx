import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import i18n from '../../localization/i18n';
import Screen from '../../components/common/Screen';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import SelectField from '../../components/forms/SelectField';
import MultiSelectChips from '../../components/forms/MultiSelectChips';
import TagInput from '../../components/forms/TagInput';
import Chip from '../../components/common/Chip';
import ProgressBar from '../../components/common/ProgressBar';
import Card from '../../components/common/Card';
import {
  ACTIVITY_OPTIONS,
  ALLERGY_OPTIONS,
  CITIES,
  COOKING_CONSTRAINTS,
  CURRENCY_BY_COUNTRY,
  DIET_OPTIONS,
  GOAL_OPTIONS,
  LANGUAGES,
  SEX_OPTIONS,
} from '../../constants/options';
import type {
  ActivityLevel,
  CountryCode,
  DietType,
  GoalType,
  Language,
  Profile,
  Sex,
  UnitSystem,
  UserBudget,
  UserGoal,
  UserPreferences,
} from '../../types';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  createPlan,
  saveBudgetData,
  saveGoalData,
  savePreferencesData,
  saveProfileData,
  setFoods,
} from '../../store/slices/dataSlice';
import { setLanguage, setUnits } from '../../store/slices/settingsSlice';
import { fetchFoods } from '../../services/data/api';
import { budgetSchema, goalSchema, personalInfoSchema, preferencesSchema } from '../../utils/validation';
import { calculateDailyTargets, calculateAge, bmi, safeCalorieTarget } from '../../utils/nutrition';
import { feetInchesToCm, formatHeight, formatWeight, kgToLb, lbToKg } from '../../utils/units';
import { titleCase } from '../../utils/format';
import { useAppTheme } from '../../theme';

interface PersonalForm {
  fullName: string;
  dateOfBirth: string;
  sex: Sex;
  heightCm: string;
  weightKg: string;
  heightFeet: string;
  heightInches: string;
  weightLb: string;
  countryCode: CountryCode;
  city: string;
  language: Language;
  units: UnitSystem;
}

const initialPersonal: PersonalForm = {
  fullName: '',
  dateOfBirth: '1995-01-01',
  sex: 'male',
  heightCm: '170',
  weightKg: '70',
  heightFeet: '5',
  heightInches: '7',
  weightLb: '154',
  countryCode: 'PK',
  city: 'Karachi',
  language: 'en',
  units: 'metric',
};

export default function OnboardingScreen() {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const session = useAppSelector(state => state.auth.session);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [personal, setPersonal] = useState<PersonalForm>(initialPersonal);
  const [goalType, setGoalType] = useState<GoalType>('loss');
  const [targetWeight, setTargetWeight] = useState('65');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [dietType, setDietType] = useState<DietType>('non_vegetarian');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [excluded, setExcluded] = useState<string[]>([]);
  const [disliked, setDisliked] = useState<string[]>([]);
  const [preferred, setPreferred] = useState<string[]>([]);
  const [cooking, setCooking] = useState<string[]>([]);
  const [budgetPeriod, setBudgetPeriod] = useState<'daily' | 'monthly'>('daily');
  const [budgetAmount, setBudgetAmount] = useState('800');

  const totalSteps = 5;
  const currencyCode = CURRENCY_BY_COUNTRY[personal.countryCode];

  const canonicalHeight = useMemo(
    () =>
      personal.units === 'imperial'
        ? feetInchesToCm(Number(personal.heightFeet) || 0, Number(personal.heightInches) || 0)
        : Number(personal.heightCm),
    [personal],
  );
  const canonicalWeight = useMemo(
    () =>
      personal.units === 'imperial'
        ? lbToKg(Number(personal.weightLb) || 0)
        : Number(personal.weightKg),
    [personal],
  );

  const updatePersonal = <K extends keyof PersonalForm>(key: K, value: PersonalForm[K]) => {
    setPersonal(current => ({ ...current, [key]: value }));
  };

  const changeUnits = (units: UnitSystem) => {
    if (units === personal.units) {
      return;
    }
    if (units === 'imperial') {
      const cm = Number(personal.heightCm) || 170;
      const feet = Math.floor(cm / 2.54 / 12);
      const inches = Math.round((cm / 2.54 - feet * 12) * 10) / 10;
      setPersonal(current => ({
        ...current,
        units,
        heightFeet: String(feet),
        heightInches: String(inches),
        weightLb: String(kgToLb(Number(current.weightKg) || 70)),
      }));
    } else {
      setPersonal(current => ({
        ...current,
        units,
        heightCm: String(
          feetInchesToCm(Number(current.heightFeet) || 0, Number(current.heightInches) || 0),
        ),
        weightKg: String(lbToKg(Number(current.weightLb) || 0)),
      }));
    }
  };

  const changeCountry = (countryCode: CountryCode) => {
    setPersonal(current => ({
      ...current,
      countryCode,
      city: CITIES[countryCode][0],
      language: current.language,
    }));
  };

  const changeLanguage = (language: Language) => {
    updatePersonal('language', language);
    dispatch(setLanguage(language));
    i18n.changeLanguage(language).catch(() => undefined);
  };

  const validatePersonal = () => {
    const parsed = personalInfoSchema.safeParse({
      fullName: personal.fullName,
      dateOfBirth: personal.dateOfBirth,
      sex: personal.sex,
      heightCm: canonicalHeight,
      weightKg: canonicalWeight,
      countryCode: personal.countryCode,
      city: personal.city,
      language: personal.language,
      units: personal.units,
    });
    if (parsed.success) {
      return {};
    }
    const next: Record<string, string> = {};
    parsed.error.issues.forEach(issue => {
      const key = String(issue.path[0] ?? 'form');
      if (!next[key]) {
        next[key] = issue.message;
      }
    });
    return next;
  };

  const validateGoal = () => {
    const parsed = goalSchema.safeParse({
      goalType,
      targetWeightKg: targetWeight,
      activityLevel,
    });
    if (parsed.success) {
      return {};
    }
    const next: Record<string, string> = {};
    parsed.error.issues.forEach(issue => {
      const key = String(issue.path[0] ?? 'form');
      if (!next[key]) {
        next[key] = issue.message;
      }
    });
    return next;
  };

  const validatePreferences = (): Record<string, string> => {
    const parsed = preferencesSchema.safeParse({
      dietType,
      allergies,
      excludedIngredients: excluded,
      dislikedFoods: disliked,
      preferredFoods: preferred,
      cookingConstraints: cooking,
      mealSchedule: ['breakfast', 'lunch', 'dinner', 'snack'],
    });
    return parsed.success
      ? {}
      : { form: parsed.error.issues[0]?.message ?? 'errors.unknown' };
  };

  const validateBudget = () => {
    const parsed = budgetSchema.safeParse({
      budgetPeriod,
      amount: budgetAmount,
      currencyCode,
      countryCode: personal.countryCode,
      city: personal.city,
    });
    if (parsed.success) {
      return {};
    }
    const next: Record<string, string> = {};
    parsed.error.issues.forEach(issue => {
      const key = String(issue.path[0] ?? 'form');
      if (!next[key]) {
        next[key] = issue.message;
      }
    });
    return next;
  };

  const next = () => {
    const validation =
      step === 0
        ? validatePersonal()
        : step === 1
          ? validateGoal()
          : step === 2
            ? validatePreferences()
            : step === 3
              ? validateBudget()
              : {};
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      return;
    }
    setStep(current => Math.min(totalSteps - 1, current + 1));
  };

  const back = () => {
    setErrors({});
    setStep(current => Math.max(0, current - 1));
  };

  const profile: Profile = useMemo(
    () => ({
      id: session?.user.id ?? 'demo-user',
      fullName: personal.fullName.trim(),
      dateOfBirth: personal.dateOfBirth,
      sex: personal.sex,
      heightCm: canonicalHeight,
      weightKg: canonicalWeight,
      countryCode: personal.countryCode,
      city: personal.city,
      language: personal.language,
      units: personal.units,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    [session, personal, canonicalHeight, canonicalWeight],
  );

  const goal: UserGoal = useMemo(
    () => ({
      goalType,
      targetWeightKg: Number(targetWeight) || canonicalWeight,
      activityLevel,
      targetDate: null,
    }),
    [goalType, targetWeight, activityLevel, canonicalWeight],
  );

  const preferences: UserPreferences = useMemo(
    () => ({
      dietType,
      allergies,
      excludedIngredients: excluded,
      dislikedFoods: disliked,
      preferredFoods: preferred,
      cookingConstraints: cooking,
      mealSchedule: ['breakfast', 'lunch', 'dinner', 'snack'],
    }),
    [dietType, allergies, excluded, disliked, preferred, cooking],
  );

  const budget: UserBudget = useMemo(
    () => ({
      budgetPeriod,
      amount: Number(budgetAmount) || 0,
      currencyCode,
      countryCode: personal.countryCode,
      city: personal.city,
    }),
    [budgetPeriod, budgetAmount, currencyCode, personal.countryCode, personal.city],
  );

  const targets = useMemo(() => calculateDailyTargets(profile, goal), [profile, goal]);
  const calorieInfo = useMemo(() => safeCalorieTarget({ profile, goal }), [profile, goal]);

  const finish = async () => {
    if (!session) {
      return;
    }
    setSaving(true);
    try {
      dispatch(saveProfileData({ userId: session.user.id, profile }));
      dispatch(saveGoalData({ userId: session.user.id, goal }));
      dispatch(savePreferencesData({ userId: session.user.id, preferences }));
      dispatch(saveBudgetData({ userId: session.user.id, budget }));
      dispatch(setUnits(personal.units));
      const foods = await fetchFoods(profile);
      dispatch(setFoods(foods));
      await dispatch(
        createPlan({
          userId: session.user.id,
          profile,
          goal,
          preferences,
          budget,
          targets,
          foods,
        }),
      ).unwrap();
    } catch {
      Alert.alert(t('common.error'), t('errors.unknown'));
    } finally {
      setSaving(false);
    }
  };

  const errorText = (key: string) =>
    errors[key] ? t(`errors.${errors[key]}`, { defaultValue: errors[key] }) : undefined;

  const age = calculateAge(personal.dateOfBirth);
  const bmiValue = bmi(canonicalWeight, canonicalHeight);

  return (
    <Screen scroll keyboard>
      <View style={styles.top}>
        <View style={styles.brandRow}>
          <View style={[styles.brandIcon, { backgroundColor: theme.colors.primarySoft }]}>
            <Ionicons name="leaf" size={20} color={theme.colors.primary} />
          </View>
          <Text style={[styles.brand, { color: theme.colors.text }]}>{t('app.name')}</Text>
          <Text style={[styles.step, { color: theme.colors.textMuted }]}>
            {t('onboarding.step', { current: step + 1, total: totalSteps })}
          </Text>
        </View>
        <ProgressBar value={step + 1} max={totalSteps} height={6} />
      </View>

      {step === 0 ? (
        <View style={styles.section}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{t('onboarding.personalTitle')}</Text>
          <Text style={[styles.body, { color: theme.colors.textMuted }]}>{t('onboarding.personalBody')}</Text>
          <Input
            label={t('onboarding.name')}
            icon="person-outline"
            value={personal.fullName}
            onChangeText={v => updatePersonal('fullName', v)}
            error={errorText('fullName')}
          />
          <Input
            label={t('onboarding.dateOfBirth')}
            icon="calendar-outline"
            value={personal.dateOfBirth}
            onChangeText={v => updatePersonal('dateOfBirth', v)}
            placeholder="1995-01-01"
            error={errorText('dateOfBirth')}
            suffix={age > 0 ? `${age} ${t('common.years')}` : undefined}
          />
          <SelectField
            label={t('onboarding.sex')}
            value={personal.sex}
            options={SEX_OPTIONS.map(o => ({ value: o.value, label: t(o.labelKey) }))}
            onChange={value => updatePersonal('sex', value as Sex)}
            error={errorText('sex')}
          />
          <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>{t('onboarding.units')}</Text>
          <View style={styles.chipRow}>
            {(['metric', 'imperial'] as UnitSystem[]).map(unit => (
              <Chip
                key={unit}
                label={t(`units.${unit}`)}
                selected={personal.units === unit}
                onPress={() => changeUnits(unit)}
              />
            ))}
          </View>
          {personal.units === 'metric' ? (
            <>
              <Input
                label={`${t('onboarding.height')} (cm)`}
                keyboardType="decimal-pad"
                value={personal.heightCm}
                onChangeText={v => updatePersonal('heightCm', v)}
                error={errorText('heightCm')}
              />
              <Input
                label={`${t('onboarding.weight')} (kg)`}
                keyboardType="decimal-pad"
                value={personal.weightKg}
                onChangeText={v => updatePersonal('weightKg', v)}
                error={errorText('weightKg')}
              />
            </>
          ) : (
            <View style={styles.row}>
              <View style={styles.flex}>
                <Input
                  label={`${t('onboarding.height')} (ft)`}
                  keyboardType="decimal-pad"
                  value={personal.heightFeet}
                  onChangeText={v => updatePersonal('heightFeet', v)}
                  error={errorText('heightCm')}
                />
              </View>
              <View style={styles.gap} />
              <View style={styles.flex}>
                <Input
                  label="(in)"
                  keyboardType="decimal-pad"
                  value={personal.heightInches}
                  onChangeText={v => updatePersonal('heightInches', v)}
                />
              </View>
              <View style={styles.gap} />
              <View style={styles.flex}>
                <Input
                  label={`${t('onboarding.weight')} (lb)`}
                  keyboardType="decimal-pad"
                  value={personal.weightLb}
                  onChangeText={v => updatePersonal('weightLb', v)}
                  error={errorText('weightKg')}
                />
              </View>
            </View>
          )}
          <SelectField
            label={t('onboarding.country')}
            value={personal.countryCode}
            options={[
              { value: 'PK', label: 'Pakistan' },
              { value: 'IN', label: 'India' },
            ]}
            onChange={value => changeCountry(value as CountryCode)}
          />
          <SelectField
            label={t('onboarding.city')}
            value={personal.city}
            options={CITIES[personal.countryCode].map(city => ({ value: city, label: city }))}
            onChange={value => updatePersonal('city', value)}
            error={errorText('city')}
          />
          <SelectField
            label={t('onboarding.language')}
            value={personal.language}
            options={LANGUAGES.map(l => ({ value: l.value, label: l.label }))}
            onChange={value => changeLanguage(value as Language)}
          />
          <Text style={[styles.helper, { color: theme.colors.textMuted }]}>
            {formatHeight(canonicalHeight, personal.units)} · {formatWeight(canonicalWeight, personal.units)}
          </Text>
        </View>
      ) : null}

      {step === 1 ? (
        <View style={styles.section}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{t('onboarding.goalTitle')}</Text>
          <Text style={[styles.body, { color: theme.colors.textMuted }]}>{t('onboarding.goalBody')}</Text>
          <View style={styles.goalRow}>
            {GOAL_OPTIONS.map(option => {
              const active = goalType === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    setGoalType(option.value);
                    if (option.value === 'loss') {
                      setTargetWeight(String(Math.round(canonicalWeight * 0.92)));
                    } else if (option.value === 'gain') {
                      setTargetWeight(String(Math.round(canonicalWeight * 1.08)));
                    } else {
                      setTargetWeight(String(Math.round(canonicalWeight)));
                    }
                  }}
                  style={[
                    styles.goalCard,
                    {
                      backgroundColor: active ? theme.colors.primarySoft : theme.colors.surface,
                      borderColor: active ? theme.colors.primary : theme.colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={option.icon}
                    size={22}
                    color={active ? theme.colors.primary : theme.colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.goalLabel,
                      { color: active ? theme.colors.primary : theme.colors.text },
                    ]}
                  >
                    {t(option.labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Input
            label={`${t('onboarding.targetWeight')} (kg)`}
            keyboardType="decimal-pad"
            value={targetWeight}
            onChangeText={setTargetWeight}
            error={errorText('targetWeightKg')}
          />
          <SelectField
            label={t('onboarding.activity')}
            value={activityLevel}
            options={ACTIVITY_OPTIONS.map(o => ({ value: o.value, label: t(o.labelKey) }))}
            onChange={value => setActivityLevel(value as ActivityLevel)}
            error={errorText('activityLevel')}
          />
        </View>
      ) : null}

      {step === 2 ? (
        <View style={styles.section}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{t('onboarding.preferencesTitle')}</Text>
          <Text style={[styles.body, { color: theme.colors.textMuted }]}>{t('onboarding.preferencesBody')}</Text>
          <SelectField
            label={t('onboarding.dietType')}
            value={dietType}
            options={DIET_OPTIONS.map(o => ({ value: o.value, label: t(o.labelKey) }))}
            onChange={value => setDietType(value as DietType)}
          />
          <MultiSelectChips
            label={t('onboarding.allergies')}
            selected={allergies}
            options={ALLERGY_OPTIONS.map(value => ({ value, label: titleCase(value) }))}
            onChange={setAllergies}
          />
          <TagInput
            label={t('onboarding.excluded')}
            values={excluded}
            onChange={setExcluded}
            placeholder="e.g. onion"
          />
          <TagInput
            label={t('onboarding.disliked')}
            values={disliked}
            onChange={setDisliked}
            placeholder="e.g. bitter gourd"
          />
          <TagInput
            label={t('onboarding.preferred')}
            values={preferred}
            onChange={setPreferred}
            placeholder="e.g. daal"
          />
          <MultiSelectChips
            label={t('onboarding.cooking')}
            selected={cooking}
            options={COOKING_CONSTRAINTS.map(value => ({ value, label: titleCase(value) }))}
            onChange={setCooking}
          />
          {errorText('form') ? (
            <Text style={[styles.formError, { color: theme.colors.danger }]}>{errorText('form')}</Text>
          ) : null}
        </View>
      ) : null}

      {step === 3 ? (
        <View style={styles.section}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{t('onboarding.budgetTitle')}</Text>
          <Text style={[styles.body, { color: theme.colors.textMuted }]}>{t('onboarding.budgetBody')}</Text>
          <View style={styles.chipRow}>
            {(['daily', 'monthly'] as const).map(period => (
              <Chip
                key={period}
                label={t(`onboarding.${period}`)}
                selected={budgetPeriod === period}
                onPress={() => setBudgetPeriod(period)}
              />
            ))}
          </View>
          <Input
            label={`${t('onboarding.budgetAmount')} (${currencyCode})`}
            keyboardType="decimal-pad"
            value={budgetAmount}
            onChangeText={setBudgetAmount}
            error={errorText('amount')}
          />
          <Card style={styles.budgetInfo}>
            <Ionicons name="information-circle-outline" size={18} color={theme.colors.info} />
            <Text style={[styles.budgetText, { color: theme.colors.textMuted }]}>
              {t('budget.staleWarning')}
            </Text>
          </Card>
        </View>
      ) : null}

      {step === 4 ? (
        <View style={styles.section}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{t('onboarding.summaryTitle')}</Text>
          <Text style={[styles.body, { color: theme.colors.textMuted }]}>{t('onboarding.summaryBody')}</Text>
          <Card elevated style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textMuted }]}>{t('onboarding.bmi')}</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                {bmiValue.toFixed(1)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textMuted }]}>{t('onboarding.bmr')}</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                {calorieInfo.bmr} kcal
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textMuted }]}>{t('onboarding.tdee')}</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                {calorieInfo.tdee} kcal
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textMuted }]}>
                {t('onboarding.calorieTarget')}
              </Text>
              <Text style={[styles.summaryValueBig, { color: theme.colors.primary }]}>
                {targets.calories} kcal
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textMuted }]}>
                {t('onboarding.proteinTarget')}
              </Text>
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                {targets.protein} g
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textMuted }]}>
                {t('onboarding.waterTarget')}
              </Text>
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                {targets.waterMl} ml
              </Text>
            </View>
          </Card>
          {calorieInfo.note ? (
            <Text style={[styles.note, { color: theme.colors.warning }]}>{calorieInfo.note}</Text>
          ) : null}
          <Text style={[styles.disclaimer, { color: theme.colors.textMuted }]}>
            {t('onboarding.disclaimer')}
          </Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        {step > 0 ? (
          <Button title={t('common.back')} variant="outline" onPress={back} style={styles.backButton} fullWidth={false} />
        ) : null}
        <View style={styles.flex}>
          <Button
            title={step === totalSteps - 1 ? t('onboarding.finish') : t('common.continue')}
            iconRight={step === totalSteps - 1 ? 'sparkles-outline' : 'arrow-forward'}
            loading={saving}
            onPress={step === totalSteps - 1 ? finish : next}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { paddingTop: 14, paddingBottom: 6 },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  brandIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  brand: { fontSize: 17, fontWeight: '800', flex: 1 },
  step: { fontSize: 12, fontWeight: '600' },
  section: { paddingTop: 20 },
  title: { fontSize: 25, fontWeight: '800' },
  body: { fontSize: 13, lineHeight: 19, marginTop: 5, marginBottom: 18 },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  row: { flexDirection: 'row' },
  flex: { flex: 1 },
  gap: { width: 8 },
  helper: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  goalRow: { flexDirection: 'row', marginBottom: 16 },
  goalCard: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginRight: 8,
  },
  goalLabel: { fontSize: 11, fontWeight: '700', marginTop: 6, textAlign: 'center' },
  formError: { fontSize: 12, marginTop: 4 },
  budgetInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  budgetText: { flex: 1, fontSize: 11, lineHeight: 16, marginLeft: 8 },
  summaryCard: { marginTop: 6 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 5 },
  summaryLabel: { fontSize: 13, fontWeight: '600' },
  summaryValue: { fontSize: 14, fontWeight: '700' },
  summaryValueBig: { fontSize: 19, fontWeight: '800' },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 8 },
  note: { fontSize: 11, lineHeight: 16, marginTop: 10, fontWeight: '600' },
  disclaimer: { fontSize: 10, lineHeight: 15, marginTop: 14 },
  actions: { flexDirection: 'row', alignItems: 'center', paddingTop: 26 },
  backButton: { marginRight: 10 },
});
