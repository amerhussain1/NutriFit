import React from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../../theme';

type Props = {
  name: string;
  onPress?: () => void;
  size?: number;
  color?: string;
  style?: ViewStyle;
  background?: boolean;
};

export default function IconButton({
  name,
  onPress,
  size = 21,
  color,
  style,
  background = true,
}: Props) {
  const theme = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.button,
        background && { backgroundColor: theme.colors.surfaceAlt },
        { opacity: pressed ? 0.7 : 1 },
        style,
      ]}
    >
      <Ionicons name={name} size={size} color={color ?? theme.colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
