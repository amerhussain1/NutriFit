import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import Screen from '../../components/common/Screen';
import ScreenHeader from '../../components/common/ScreenHeader';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Chip from '../../components/common/Chip';
import SelectField from '../../components/forms/SelectField';
import EmptyState from '../../components/common/EmptyState';
import { CITIES, LANGUAGES, SEX_OPTIONS } from '../../constants/options';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { saveProfileData } from '../../store/slices/dataSlice';
import { setLanguage, setUnits } from '../../store/slices/settingsSlice';
import { personalInfoSchema } from '../../utils/validation';
import { feetInchesToCm, kgToLb, lbToKg } from '../../utils/units';
import { useAppTheme } from '../../theme';
import type { CountryCode, Language, Sex, UnitSystem } from '../../types';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

export default function EditProfileScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { profile } = useAppSelector(state => state.data);
  const session = useAppSelector(state => state.auth.session);
  const userId = session?.user.id ?? 'demo-user';
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fullName, setFullName] = useState(profile?.fullName ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(profile?.dateOfBirth ?? '1995-01-01');
  const [sex, setSex] = useState<Sex>(profile?.sex ?? 'other');
  const [countryCode, setCountryCode] = useState<CountryCode>(profile?.countryCode ?? 'PK');
  const [city, setCity] = useState(profile?.city ?? 'Karachi');
  const [language, setLocalLanguage] = useState<Language>(profile?.language ?? 'en');
  const [units, setLocalUnits] = useState<UnitSystem>(profile?.units ?? 'metric');
  const [heightCm, setHeightCm] = useState(String(profile?.heightCm ?? 170));
  const [weightKg, setWeightKg] = useState(String(profile?.weightKg ?? 70));
  const [heightFeet, setHeightFeet] = useState('5');
  const [heightInches, setHeightInches] = useState('7');
  const [weightLb, setWeightLb] = useState(String(kgToLb(profile?.weightKg ?? 70)));

  if (!profile) {
    return (
      <Screen>
        <ScreenHeader title={t('profile.editProfile')} onBack={() => navigation.goBack()} />
        <EmptyState icon="person-outline" title={t('common.notAvailable')} />
      </Screen>
    );
  }

  const changeUnits = (next: UnitSystem) => {
    if (next === units) {
      return;
    }
    if (next === 'imperial') {
      const cm = Number(heightCm) || 170;
      const feet = Math.floor(cm / 2.54 / 12);
      const inches = Math.round((cm / 2.54 - feet * 12) * 10) / 10;
      setHeightFeet(String(feet));
      setHeightInches(String(inches));
      setWeightLb(String(kgToLb(Number(weightKg) || 70)));
    } else {
      setHeightCm(String(feetInchesToCm(Number(heightFeet) || 0, Number(heightInches) || 0)));
      setWeightKg(String(lbToKg(Number(weightLb) || 0)));
    }
    setLocalUnits(next);
  };

  const save = async () => {
    const canonicalHeight =
      units === 'imperial'
        ? feetInchesToCm(Number(heightFeet) || 0, Number(heightInches) || 0)
        : Number(heightCm);
    const canonicalWeight =
      units === 'imperial' ? lbToKg(Number(weightLb) || 0) : Number(weightKg);
    const parsed = personalInfoSchema.safeParse({
      fullName,
      dateOfBirth,
      sex,
      heightCm: canonicalHeight,
      weightKg: canonicalWeight,
      countryCode,
      city,
      language,
      units,
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      parsed.error.issues.forEach(issue => {
        const key = String(issue.path[0] ?? 'form');
        if (!next[key]) {
          next[key] = issue.message;
        }
      });
      setErrors(next);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await dispatch(
        saveProfileData({
          userId,
          profile: {
            ...profile,
            fullName: fullName.trim(),
            dateOfBirth,
            sex,
            heightCm: canonicalHeight,
            weightKg: canonicalWeight,
            countryCode,
            city,
            language,
            units,
            updatedAt: new Date().toISOString(),
          },
        }),
      ).unwrap();
      dispatch(setUnits(units));
      dispatch(setLanguage(language));
      Alert.alert(t('common.save'));
      navigation.goBack();
    } catch {
      Alert.alert(t('common.error'), t('errors.unknown'));
    } finally {
      setSaving(false);
    }
  };

  const errorText = (key: string) =>
    errors[key] ? t(`errors.${errors[key]}`, { defaultValue: errors[key] }) : undefined;

  return (
    <Screen scroll keyboard>
      <ScreenHeader title={t('profile.editProfile')} onBack={() => navigation.goBack()} />
      <Input label={t('onboarding.name')} icon="person-outline" value={fullName} onChangeText={setFullName} error={errorText('fullName')} />
      <Input label={t('onboarding.dateOfBirth')} icon="calendar-outline" value={dateOfBirth} onChangeText={setDateOfBirth} error={errorText('dateOfBirth')} />
      <SelectField
        label={t('onboarding.sex')}
        value={sex}
        options={SEX_OPTIONS.map(o => ({ value: o.value, label: t(o.labelKey) }))}
        onChange={value => setSex(value as Sex)}
      />
      <Text style={[styles.label, { color: theme.colors.textMuted }]}>{t('onboarding.units')}</Text>
      <View style={styles.chipRow}>
        {(['metric', 'imperial'] as UnitSystem[]).map(unit => (
          <Chip key={unit} label={t(`units.${unit}`)} selected={units === unit} onPress={() => changeUnits(unit)} />
        ))}
      </View>
      {units === 'metric' ? (
        <>
          <Input label={`${t('onboarding.height')} (cm)`} keyboardType="decimal-pad" value={heightCm} onChangeText={setHeightCm} error={errorText('heightCm')} />
          <Input label={`${t('onboarding.weight')} (kg)`} keyboardType="decimal-pad" value={weightKg} onChangeText={setWeightKg} error={errorText('weightKg')} />
        </>
      ) : (
        <View style={styles.row}>
          <View style={styles.flex}>
            <Input label={`${t('onboarding.height')} (ft)`} keyboardType="decimal-pad" value={heightFeet} onChangeText={setHeightFeet} />
          </View>
          <View style={styles.gap} />
          <View style={styles.flex}>
            <Input label="(in)" keyboardType="decimal-pad" value={heightInches} onChangeText={setHeightInches} />
          </View>
          <View style={styles.gap} />
          <View style={styles.flex}>
            <Input label={`${t('onboarding.weight')} (lb)`} keyboardType="decimal-pad" value={weightLb} onChangeText={setWeightLb} error={errorText('weightKg')} />
          </View>
        </View>
      )}
      <SelectField
        label={t('onboarding.country')}
        value={countryCode}
        options={[
          { value: 'PK', label: 'Pakistan' },
          { value: 'IN', label: 'India' },
        ]}
        onChange={value => {
          const next = value as CountryCode;
          setCountryCode(next);
          setCity(CITIES[next][0]);
        }}
      />
      <SelectField
        label={t('onboarding.city')}
        value={city}
        options={CITIES[countryCode].map(c => ({ value: c, label: c }))}
        onChange={setCity}
        error={errorText('city')}
      />
      <SelectField
        label={t('onboarding.language')}
        value={language}
        options={LANGUAGES.map(item => ({ value: item.value, label: item.label }))}
        onChange={value => setLocalLanguage(value as Language)}
      />
      <Button title={t('common.save')} loading={saving} onPress={save} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  row: { flexDirection: 'row' },
  flex: { flex: 1 },
  gap: { width: 8 },
});
