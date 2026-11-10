import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../theme';
import Chip from '../common/Chip';

type Props = {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
  help?: string;
};

export default function MultiSelectChips({ label, options, selected, onChange, help }: Props) {
  const theme = useAppTheme();
  const toggle = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter(v => v !== value)
        : [...selected, value],
    );
  };
  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: theme.colors.textMuted }]}>{label}</Text>
      {help ? <Text style={[styles.help, { color: theme.colors.textMuted }]}>{help}</Text> : null}
      <View style={styles.row}>
        {options.map(option => (
          <Chip
            key={option.value}
            label={option.label}
            selected={selected.includes(option.value)}
            onPress={() => toggle(option.value)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  help: { fontSize: 11, marginBottom: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
});
