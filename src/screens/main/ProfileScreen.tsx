import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import i18n from '../../localization/i18n';
import Screen from '../../components/common/Screen';
import ScreenHeader from '../../components/common/ScreenHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Chip from '../../components/common/Chip';
import Avatar from '../../components/common/Avatar';
import DemoBanner from '../../components/common/DemoBanner';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { deleteAccount, logout } from '../../store/slices/authSlice';
import { resetData, saveProfileData } from '../../store/slices/dataSlice';
import { setLanguage, setThemeMode, setUnits } from '../../store/slices/settingsSlice';
import { LANGUAGES } from '../../constants/options';
import { bmi, bmiCategory } from '../../utils/nutrition';
import { formatHeight, formatWeight } from '../../utils/units';
import { titleCase } from '../../utils/format';
import { useAppTheme } from '../../theme';
import type { Language, ThemeMode, UnitSystem } from '../../types';
import type { MainTabNavigation } from '../../navigation/types';

export default function ProfileScreen() {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<MainTabNavigation>();
  const dispatch = useAppDispatch();
  const { profile, demo } = useAppSelector(state => state.data);
  const session = useAppSelector(state => state.auth.session);
  const settings = useAppSelector(state => state.settings);
  const userId = session?.user.id ?? 'demo-user';

  const bmiValue = profile ? bmi(profile.weightKg, profile.heightCm) : 0;

  const changeLanguage = (language: Language) => {
    dispatch(setLanguage(language));
    i18n.changeLanguage(language).catch(() => undefined);
    if (profile) {
      dispatch(saveProfileData({ userId, profile: { ...profile, language } }));
    }
  };

  const changeUnits = (units: UnitSystem) => {
    dispatch(setUnits(units));
    if (profile) {
      dispatch(saveProfileData({ userId, profile: { ...profile, units } }));
    }
  };

  const confirmLogout = () => {
    Alert.alert(t('profile.logout'), t('profile.demoMode'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.logout'),
        style: 'destructive',
        onPress: async () => {
          await dispatch(logout());
          dispatch(resetData());
        },
      },
    ]);
  };

  const confirmDelete = () => {
    Alert.alert(t('profile.deleteAccount'), t('profile.deleteAccountBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await dispatch(deleteAccount()).unwrap();
            dispatch(resetData());
          } catch {
            Alert.alert(t('common.error'), t('errors.unknown'));
          }
        },
      },
    ]);
  };

  return (
    <Screen scroll>
      <ScreenHeader title={t('profile.title')} />

      <Card elevated style={styles.profileCard}>
        <View style={styles.profileTop}>
          <Avatar name={profile?.fullName ?? session?.user.fullName} size={64} />
          <View style={styles.profileText}>
            <Text style={[styles.name, { color: theme.colors.text }]}>
              {profile?.fullName ?? session?.user.fullName ?? 'NutriFit'}
            </Text>
            <Text style={[styles.email, { color: theme.colors.textMuted }]}>
              {session?.user.email ?? t('profile.demoMode')}
            </Text>
            {demo ? (
              <View style={[styles.demoPill, { backgroundColor: theme.colors.warningSoft }]}>
                <Ionicons name="flask-outline" size={11} color={theme.colors.warning} />
                <Text style={[styles.demoText, { color: theme.colors.warning }]}>{t('profile.demoMode')}</Text>
              </View>
            ) : null}
          </View>
        </View>
        {profile ? (
          <View style={[styles.profileStats, { borderTopColor: theme.colors.border }]}>
            <ProfileStat label={t('onboarding.height')} value={formatHeight(profile.heightCm, profile.units)} />
            <ProfileStat label={t('onboarding.weight')} value={formatWeight(profile.weightKg, profile.units)} />
            <ProfileStat label={t('onboarding.bmi')} value={bmiValue.toFixed(1)} hint={titleCase(bmiCategory(bmiValue))} />
          </View>
        ) : null}
      </Card>

      {demo ? <DemoBanner /> : null}

      <Text style={[styles.section, { color: theme.colors.text }]}>{t('profile.account')}</Text>
      <Card padded={false}>
        <MenuRow icon="person-outline" label={t('profile.editProfile')} onPress={() => navigation.navigate('EditProfile')} />
        <MenuRow icon="flag-outline" label={t('profile.editGoal')} onPress={() => navigation.navigate('EditGoal')} />
        <MenuRow icon="wallet-outline" label={t('profile.editBudget')} onPress={() => navigation.navigate('EditBudget')} />
        <MenuRow icon="options-outline" label={t('profile.editPreferences')} onPress={() => navigation.navigate('EditPreferences')} last />
      </Card>

      <Text style={[styles.section, { color: theme.colors.text }]}>{t('profile.preferences')}</Text>
      <Card>
        <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>{t('profile.language')}</Text>
        <View style={styles.chipRow}>
          {LANGUAGES.map(language => (
            <Chip
              key={language.value}
              label={language.label}
              selected={settings.language === language.value}
              onPress={() => changeLanguage(language.value)}
            />
          ))}
        </View>
        <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>{t('profile.theme')}</Text>
        <View style={styles.chipRow}>
          {(['light', 'dark', 'system'] as ThemeMode[]).map(mode => (
            <Chip
              key={mode}
              label={t(`profile.${mode}`)}
              selected={settings.themeMode === mode}
              onPress={() => dispatch(setThemeMode(mode))}
            />
          ))}
        </View>
        <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>{t('profile.units')}</Text>
        <View style={styles.chipRow}>
          {(['metric', 'imperial'] as UnitSystem[]).map(unit => (
            <Chip
              key={unit}
              label={t(`units.${unit}`)}
              selected={settings.units === unit}
              onPress={() => changeUnits(unit)}
              accent={theme.colors.accent}
            />
          ))}
        </View>
      </Card>

      <Text style={[styles.section, { color: theme.colors.text }]}>{t('common.seeAll')}</Text>
      <Card padded={false}>
        <MenuRow icon="heart-outline" label={t('favorites.title')} onPress={() => navigation.navigate('Favorites')} />
        <MenuRow icon="cart-outline" label={t('grocery.title')} onPress={() => navigation.navigate('Grocery')} />
        <MenuRow icon="server-outline" label={t('profile.admin')} onPress={() => navigation.navigate('Admin')} />
        <MenuRow
          icon="information-circle-outline"
          label={t('profile.about')}
          onPress={() =>
            Alert.alert(
              t('app.name'),
              `${t('app.tagline')}\n\n${t('onboarding.disclaimer')}\n\nv1.0.0`,
            )
          }
          last
        />
      </Card>

      <View style={styles.actions}>
        <Button title={t('profile.logout')} icon="log-out-outline" variant="outline" onPress={confirmLogout} />
        <View style={styles.actionGap} />
        <Button title={t('profile.deleteAccount')} icon="trash-outline" variant="danger" onPress={confirmDelete} />
        <Text style={[styles.disclaimer, { color: theme.colors.textMuted }]}>{t('onboarding.disclaimer')}</Text>
      </View>
    </Screen>
  );
}

function ProfileStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  const theme = useAppTheme();
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>{label}</Text>
      {hint ? <Text style={[styles.statHint, { color: theme.colors.accent }]}>{hint}</Text> : null}
    </View>
  );
}

function MenuRow({
  icon,
  label,
  onPress,
  last = false,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  last?: boolean;
}) {
  const theme = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuRow,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
        pressed && { backgroundColor: theme.colors.surfaceAlt },
      ]}
    >
      <View style={[styles.menuIcon, { backgroundColor: theme.colors.primarySoft }]}>
        <Ionicons name={icon} size={17} color={theme.colors.primary} />
      </View>
      <Text style={[styles.menuLabel, { color: theme.colors.text }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={17} color={theme.colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  profileCard: { marginTop: 2 },
  profileTop: { flexDirection: 'row', alignItems: 'center' },
  profileText: { flex: 1, marginLeft: 14 },
  name: { fontSize: 20, fontWeight: '800' },
  email: { fontSize: 12, marginTop: 3 },
  demoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 7,
  },
  demoText: { fontSize: 9, fontWeight: '700', marginLeft: 4 },
  profileStats: { flexDirection: 'row', marginTop: 16, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 15, fontWeight: '800' },
  statLabel: { fontSize: 10, marginTop: 2 },
  statHint: { fontSize: 9, fontWeight: '700', marginTop: 2 },
  section: { fontSize: 16, fontWeight: '800', marginTop: 20, marginBottom: 9 },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 7 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: 13 },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
  actions: { marginTop: 24 },
  actionGap: { height: 10 },
  disclaimer: { fontSize: 10, lineHeight: 15, marginTop: 18, textAlign: 'center' },
});
