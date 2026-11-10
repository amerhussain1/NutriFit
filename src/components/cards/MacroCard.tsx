import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../theme';
import ProgressBar from '../common/ProgressBar';

type Props = {
  label: string;
  value: number;
  target: number;
  color: string;
  unit?: string;
};

export default function MacroCard({ label, value, target, color, unit = 'g' }: Props) {
  const theme = useAppTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <Text style={[styles.label, { color: theme.colors.textMuted }]}>{label}</Text>
      <Text style={[styles.value, { color: theme.colors.text }]}>
        {Math.round(value)}
        <Text style={[styles.target, { color: theme.colors.textMuted }]}>
          {' '}
          / {Math.round(target)}
          {unit}
        </Text>
      </Text>
      <ProgressBar value={value} max={target} color={color} height={5} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 11,
    marginHorizontal: 3,
  },
  label: { fontSize: 11, fontWeight: '600' },
  value: { fontSize: 15, fontWeight: '800', marginTop: 4, marginBottom: 7 },
  target: { fontSize: 10, fontWeight: '600' },
});
