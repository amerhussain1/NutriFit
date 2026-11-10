import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../../theme';
import Button from './Button';

type Props = {
  icon?: string;
  title: string;
  body?: string;
  actionTitle?: string;
  onAction?: () => void;
};

export default function EmptyState({ icon = 'leaf-outline', title, body, actionTitle, onAction }: Props) {
  const theme = useAppTheme();
  return (
    <View style={styles.wrapper}>
      <View style={[styles.iconCircle, { backgroundColor: theme.colors.primarySoft }]}>
        <Ionicons name={icon} size={30} color={theme.colors.primary} />
      </View>
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      {body ? <Text style={[styles.body, { color: theme.colors.textMuted }]}>{body}</Text> : null}
      {actionTitle && onAction ? (
        <Button title={actionTitle} onPress={onAction} fullWidth={false} style={styles.button} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 24 },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  body: { fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 6 },
  button: { marginTop: 18 },
});
