import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type TextInputProps,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../../theme';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  icon?: string;
  secure?: boolean;
  suffix?: string;
  keyboardType?: KeyboardTypeOptions;
};

export default function Input({
  label,
  error,
  icon,
  secure = false,
  suffix,
  style,
  ...rest
}: Props) {
  const theme = useAppTheme();
  const [hidden, setHidden] = useState(secure);

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>{label}</Text>
      ) : null}
      <View
        style={[
          styles.field,
          {
            backgroundColor: theme.colors.surface,
            borderColor: error ? theme.colors.danger : theme.colors.border,
          },
        ]}
      >
        {icon ? (
          <Ionicons name={icon} size={19} color={theme.colors.textMuted} style={styles.icon} />
        ) : null}
        <TextInput
          {...rest}
          style={[styles.input, { color: theme.colors.text }, style]}
          placeholderTextColor={theme.colors.textMuted}
          secureTextEntry={secure ? hidden : false}
          selectionColor={theme.colors.primary}
        />
        {suffix ? <Text style={[styles.suffix, { color: theme.colors.textMuted }]}>{suffix}</Text> : null}
        {secure ? (
          <Pressable onPress={() => setHidden(v => !v)} hitSlop={10}>
            <Ionicons
              name={hidden ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={theme.colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, paddingVertical: 12 },
  suffix: { fontSize: 13, marginLeft: 8 },
  error: { fontSize: 12, marginTop: 6 },
});
