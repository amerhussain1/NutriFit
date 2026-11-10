import React from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../theme';
import Button from './Button';

type Props = { error?: string | null; onRetry?: () => void };

export default function BootScreen({ error, onRetry }: Props) {
  const theme = useAppTheme();
  const { t } = useTranslation();
  return (
    <View style={[styles.wrapper, { backgroundColor: theme.colors.background }]}>
      <Image source={require('../../../assets/LoginLogo.png')} style={styles.logo} resizeMode="contain" />
      <Text style={[styles.brand, { color: theme.colors.text }]}>{t('app.name')}</Text>
      <Text style={[styles.tagline, { color: theme.colors.textMuted }]}>{t('app.tagline')}</Text>
      {error ? (
        <View style={styles.errorWrap}>
          <Text style={[styles.error, { color: theme.colors.danger }]}>
            {t('errors.network')}
          </Text>
          {onRetry ? <Button title={t('common.retry')} onPress={onRetry} fullWidth={false} /> : null}
        </View>
      ) : (
        <ActivityIndicator color={theme.colors.primary} style={styles.spinner} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  logo: { width: 108, height: 108, borderRadius: 28 },
  brand: { fontSize: 30, fontWeight: '800', marginTop: 16 },
  tagline: { fontSize: 13, textAlign: 'center', marginTop: 6 },
  spinner: { marginTop: 30 },
  errorWrap: { marginTop: 28, alignItems: 'center' },
  error: { fontSize: 13, textAlign: 'center', marginBottom: 14 },
});
