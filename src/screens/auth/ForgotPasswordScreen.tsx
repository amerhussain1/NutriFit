import React, { useState } from 'react';
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
import { forgotPasswordSchema } from '../../utils/validation';
import { resetPassword } from '../../services/auth/authService';
import { useAppTheme } from '../../theme';
import type { AuthStackParamList } from '../../navigation/types';

type FormValues = z.infer<typeof forgotPasswordSchema>;
type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const submit = handleSubmit(async values => {
    setLoading(true);
    setError(null);
    try {
      await resetPassword(values.email);
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  });

  return (
    <Screen scroll keyboard>
      <ScreenHeader
        title={t('auth.resetPassword')}
        subtitle={t('auth.resetSent')}
        onBack={() => navigation.goBack()}
      />
      <View style={styles.form}>
        <ErrorBanner message={error} onClose={() => setError(null)} />
        {sent ? (
          <View style={[styles.notice, { backgroundColor: theme.colors.successSoft }]}>
            <Text style={[styles.noticeText, { color: theme.colors.success }]}>{t('auth.resetSent')}</Text>
          </View>
        ) : null}
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
        <Button title={t('auth.resetPassword')} loading={loading} onPress={submit} />
        <Button title={t('common.back')} variant="ghost" onPress={() => navigation.goBack()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { paddingTop: 18 },
  notice: { padding: 12, borderRadius: 12, marginBottom: 14 },
  noticeText: { fontSize: 12, fontWeight: '600', lineHeight: 17 },
});
