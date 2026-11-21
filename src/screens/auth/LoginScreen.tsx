import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { useTranslation } from 'react-i18next';
import Screen from '../../components/common/Screen';
import ScreenHeader from '../../components/common/ScreenHeader';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import ErrorBanner from '../../components/common/ErrorBanner';
import { loginSchema } from '../../utils/validation';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { clearAuthError, loginWithEmail, loginWithGoogle } from '../../store/slices/authSlice';
import { useAppTheme } from '../../theme';
import type { AuthStackParamList } from '../../navigation/types';

type FormValues = z.infer<typeof loginSchema>;
type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { error, pending } = useAppSelector(state => state.auth);
  const { control, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const submit = handleSubmit(values => {
    dispatch(loginWithEmail(values));
  });

  return (
    <Screen scroll keyboard>
      <ScreenHeader title={t('auth.signInTitle')} subtitle={t('auth.authBody')} onBack={() => navigation.goBack()} />
      <View style={styles.form}>
        <ErrorBanner message={error} onClose={() => dispatch(clearAuthError())} />
        <Controller
          control={control}
          name="email"
          render={({ field, fieldState }) => (
            <Input
              label={t('auth.email')}
              icon="mail-outline"
              autoCapitalize="none"
              keyboardType="email-address"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error ? t(`errors.${fieldState.error.message}`) : undefined}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <Input
              label={t('auth.password')}
              icon="lock-closed-outline"
              secure
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error ? t(`errors.${fieldState.error.message}`) : undefined}
            />
          )}
        />
        <Pressable onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgot}>
          <Text style={[styles.link, { color: theme.colors.primary }]}>{t('auth.forgotPassword')}</Text>
        </Pressable>
        <Button
          title={t('common.signIn')}
          loading={pending || formState.isSubmitting}
          onPress={submit}
        />
        <View style={styles.divider}>
          <View style={[styles.line, { backgroundColor: theme.colors.border }]} />
          <Text style={[styles.or, { color: theme.colors.textMuted }]}>{t('common.or')}</Text>
          <View style={[styles.line, { backgroundColor: theme.colors.border }]} />
        </View>
        <Button
          title={t('auth.google')}
          variant="outline"
          icon="logo-google"
          onPress={() => {
            console.log('[LoginScreen] Google button pressed');
            dispatch(loginWithGoogle());
          }}
        />
        <Button
          title={t('auth.noAccount')}
          variant="ghost"
          onPress={() => navigation.navigate('Register')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { paddingTop: 18 },
  forgot: { alignSelf: 'flex-end', marginBottom: 18, marginTop: -2 },
  link: { fontSize: 13, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 18 },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
  or: { fontSize: 11, fontWeight: '700', marginHorizontal: 12 },
});
