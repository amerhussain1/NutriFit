import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../../theme';

type Props = {
  label: string;
  value: string;
  icon?: string;
  color?: string;
  hint?: string;
};

export default function StatTile({ label, value, icon, color, hint }: Props) {
  const theme = useAppTheme();
  return (
    <View style={[styles.tile, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      {icon ? <Ionicons name={icon} size={18} color={color ?? theme.colors.primary} /> : null}
      <Text style={[styles.value, { color: theme.colors.text }]}>{value}</Text>
      <Text style={[styles.label, { color: theme.colors.textMuted }]}>{label}</Text>
      {hint ? <Text style={[styles.hint, { color: color ?? theme.colors.primary }]}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 12,
    minHeight: 92,
  },
  value: { fontSize: 19, fontWeight: '800', marginTop: 6 },
  label: { fontSize: 11, marginTop: 2, fontWeight: '600' },
  hint: { fontSize: 10, fontWeight: '700', marginTop: 4 },
});
