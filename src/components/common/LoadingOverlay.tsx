import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../theme';

type Props = { visible: boolean; message?: string };

export default function LoadingOverlay({ visible, message }: Props) {
  const theme = useAppTheme();
  const { t } = useTranslation();
  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
      <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.text, { color: theme.colors.text }]}>
            {message ?? t('common.loading')}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { paddingHorizontal: 30, paddingVertical: 24, borderRadius: 20, alignItems: 'center' },
  text: { marginTop: 12, fontSize: 14, fontWeight: '600' },
});
