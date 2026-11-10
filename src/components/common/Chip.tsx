import React from 'react';
import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { useAppTheme } from '../../theme';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  accent?: string;
};

export default function Chip({ label, selected = false, onPress, style, accent }: Props) {
  const theme = useAppTheme();
  const color = accent ?? theme.colors.primary;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? color : theme.colors.surfaceAlt,
          borderColor: selected ? color : theme.colors.border,
          opacity: pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      <Text style={[styles.text, { color: selected ? '#FFFFFF' : theme.colors.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  text: { fontSize: 13, fontWeight: '600' },
});
