import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../../theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

type Props = {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  iconRight?: string;
  style?: ViewStyle;
  fullWidth?: boolean;
  size?: 'md' | 'sm';
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  iconRight,
  style,
  fullWidth = true,
  size = 'md',
}: Props) {
  const theme = useAppTheme();
  const isDisabled = disabled || loading;
  const background =
    variant === 'primary'
      ? theme.colors.primary
      : variant === 'secondary'
        ? theme.colors.primarySoft
        : variant === 'danger'
          ? theme.colors.danger
          : 'transparent';
  const textColor =
    variant === 'primary' || variant === 'danger'
      ? '#FFFFFF'
      : variant === 'secondary'
        ? theme.colors.primary
        : theme.colors.text;
  const borderColor =
    variant === 'outline' ? theme.colors.borderStrong : 'transparent';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={isDisabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' && styles.small,
        {
          backgroundColor: background,
          borderColor,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          opacity: isDisabled ? 0.55 : pressed ? 0.85 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        variant === 'primary' && !isDisabled ? styles.shadow : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.row}>
          {icon ? <Ionicons name={icon} size={18} color={textColor} style={styles.leftIcon} /> : null}
          <Text style={[styles.text, size === 'sm' && styles.smallText, { color: textColor }]}>
            {title}
          </Text>
          {iconRight ? (
            <Ionicons name={iconRight} size={18} color={textColor} style={styles.rightIcon} />
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  small: { minHeight: 40, borderRadius: 12, paddingHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 16, fontWeight: '700' },
  smallText: { fontSize: 14 },
  leftIcon: { marginRight: 8 },
  rightIcon: { marginLeft: 8 },
  shadow: {
    shadowColor: '#FF7A00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 6,
  },
});
