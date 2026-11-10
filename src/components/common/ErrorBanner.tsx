import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../theme';

type Props = { message?: string | null; onClose?: () => void };

export default function ErrorBanner({ message, onClose }: Props) {
  const theme = useAppTheme();
  const { t } = useTranslation();
  if (!message) {
    return null;
  }
  const translated = message.includes('.') ? t(message, { defaultValue: message }) : message;
  return (
    <View style={[styles.banner, { backgroundColor: theme.colors.dangerSoft }]}>
      <Ionicons name="alert-circle-outline" size={17} color={theme.colors.danger} />
      <Text style={[styles.text, { color: theme.colors.danger }]}>{translated}</Text>
      {onClose ? (
        <Pressable onPress={onClose} hitSlop={8}>
          <Ionicons name="close" size={16} color={theme.colors.danger} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  text: { flex: 1, fontSize: 12, fontWeight: '600', marginHorizontal: 8 },
});
