import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../../theme';

type Props = {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
};

export default function TagInput({ label, values, onChange, placeholder }: Props) {
  const theme = useAppTheme();
  const [text, setText] = useState('');

  const add = () => {
    const value = text.trim();
    if (value && !values.some(v => v.toLowerCase() === value.toLowerCase())) {
      onChange([...values, value]);
    }
    setText('');
  };

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: theme.colors.textMuted }]}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={add}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          style={[
            styles.input,
            {
              color: theme.colors.text,
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
          returnKeyType="done"
        />
        <Pressable
          onPress={add}
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </Pressable>
      </View>
      {values.length > 0 ? (
        <View style={styles.tags}>
          {values.map(value => (
            <Pressable
              key={value}
              onPress={() => onChange(values.filter(v => v !== value))}
              style={[styles.tag, { backgroundColor: theme.colors.primarySoft }]}
            >
              <Text style={[styles.tagText, { color: theme.colors.primary }]}>{value}</Text>
              <Ionicons name="close" size={13} color={theme.colors.primary} />
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  addButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: { fontSize: 12, fontWeight: '600', marginRight: 4 },
});
