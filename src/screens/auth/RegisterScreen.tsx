import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { useTranslation } from 'react-i18next';
import Screen from '../../components/common/Screen';
import ScreenHeader from '../../components/common/ScreenHeader';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import ErrorBanner from '../../components/common/ErrorBanner';
import { signUpSchema } from '../../utils/validation';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { clearAuthError, registerWithEmail } from '../../store/slices/authSlice';
import { useAppTheme } from '../../theme';
import type { AuthStackParamList } from '../../navigation/types';

type FormValues = z.infer<typeof signUpSchema>;
type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { error, pending, needsEmailConfirmation } = useAppSelector(state => state.auth);
  const { control, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  });

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const submit = handleSubmit(values => {
    dispatch(registerWithEmail(values));
  });

  const errorText = (message?: string) =>
    message ? t(`errors.${message}`, { defaultValue: message }) : undefined;

  return (
    <Screen scroll keyboard>
      <ScreenHeader title={t('auth.signUpTitle')} subtitle={t('auth.authBody')} onBack={() => navigation.goBack()} />
      <View style={styles.form}>
        <ErrorBanner message={error} onClose={() => dispatch(clearAuthError())} />
        {needsEmailConfirmation ? (
          <View style={[styles.notice, { backgroundColor: theme.colors.successSoft }]}>
            <Text style={[styles.noticeText, { color: theme.colors.success }]}>
              {t('auth.confirmEmail')}
            </Text>
          </View>
        ) : null}
        <Controller
          control={control}
          name="fullName"
          render={({ field, fieldState }) => (
            <Input
              label={t('auth.fullName')}
              icon="person-outline"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errorText(fieldState.error?.message)}
            />
          )}
        />
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
              error={errorText(fieldState.error?.message)}
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
              error={errorText(fieldState.error?.message)}
            />
          )}
        />
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field, fieldState }) => (
            <Input
              label={t('auth.confirmPassword')}
              icon="lock-closed-outline"
              secure
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errorText(fieldState.error?.message)}
            />
          )}
        />
        <Button title={t('auth.createAccount')} loading={pending || formState.isSubmitting} onPress={submit} />
        <Button title={t('auth.haveAccount')} variant="ghost" onPress={() => navigation.navigate('Login')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { paddingTop: 18 },
  notice: { padding: 12, borderRadius: 12, marginBottom: 14 },
  noticeText: { fontSize: 12, fontWeight: '600', lineHeight: 17 },
});
