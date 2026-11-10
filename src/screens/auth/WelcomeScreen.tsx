import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import Screen from '../../components/common/Screen';
import Button from '../../components/common/Button';
import ErrorBanner from '../../components/common/ErrorBanner';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { clearAuthError, loginDemo, loginWithGoogle } from '../../store/slices/authSlice';
import { useAppTheme } from '../../theme';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export default function WelcomeScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { error, pending } = useAppSelector(state => state.auth);

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  return (
    <Screen scroll contentStyle={styles.content}>
      <View style={styles.hero}>
        <Image source={require('../../../assets/LoginLogo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={[styles.brand, { color: theme.colors.primary }]}>{t('app.name')}</Text>
        <Text style={[styles.title, { color: theme.colors.text }]}>{t('auth.welcomeTitle')}</Text>
        <Text style={[styles.body, { color: theme.colors.textMuted }]}>{t('auth.welcomeBody')}</Text>
      </View>

      <View style={styles.actions}>
        <ErrorBanner message={error} onClose={() => dispatch(clearAuthError())} />
        <Button
          title={t('auth.getStarted')}
          icon="arrow-forward"
          onPress={() => navigation.navigate('Register')}
        />
        <View style={styles.spacer} />
        <Button
          title={t('auth.google')}
          variant="outline"
          icon="logo-google"
          loading={pending}
          onPress={() => dispatch(loginWithGoogle())}
        />
        <View style={styles.spacer} />
        <Button
          title={t('auth.demoButton')}
          variant="secondary"
          icon="flask-outline"
          onPress={() => dispatch(loginDemo())}
        />
        <Text style={[styles.demoNote, { color: theme.colors.textMuted }]}>{t('auth.demoBody')}</Text>
        <Button
          title={t('auth.alreadyHaveAccount')}
          variant="ghost"
          onPress={() => navigation.navigate('Login')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'space-between', paddingTop: 20 },
  hero: { alignItems: 'center', paddingTop: 20 },
  logo: { width: 132, height: 132, borderRadius: 34 },
  brand: { fontSize: 30, fontWeight: '800', marginTop: 18 },
  title: { fontSize: 26, lineHeight: 33, fontWeight: '800', textAlign: 'center', marginTop: 14 },
  body: { fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 10, paddingHorizontal: 10 },
  actions: { paddingTop: 32 },
  spacer: { height: 10 },
  demoNote: { fontSize: 11, textAlign: 'center', marginTop: 10, lineHeight: 16 },
});
