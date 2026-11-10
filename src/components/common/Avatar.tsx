import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../theme';

type Props = { name?: string | null; size?: number };

export default function Avatar({ name, size = 48 }: Props) {
  const theme = useAppTheme();
  const initials = (name ?? 'N')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('');
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.colors.primarySoft,
        },
      ]}
    >
      <Text style={[styles.text, { color: theme.colors.primary, fontSize: size * 0.36 }]}>
        {initials || 'N'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
  text: { fontWeight: '800' },
});
