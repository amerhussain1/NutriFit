import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../../theme';

export type SelectOption = { value: string; label: string; hint?: string };

type Props = {
  label?: string;
  value?: string;
  placeholder?: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  error?: string;
};

export default function SelectField({
  label,
  value,
  placeholder = 'Select',
  options,
  onChange,
  error,
}: Props) {
  const theme = useAppTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={[styles.label, { color: theme.colors.textMuted }]}>{label}</Text> : null}
      <Pressable
        onPress={() => setOpen(true)}
        style={[
          styles.field,
          {
            backgroundColor: theme.colors.surface,
            borderColor: error ? theme.colors.danger : theme.colors.border,
          },
        ]}
      >
        <Text style={[styles.value, { color: selected ? theme.colors.text : theme.colors.textMuted }]}>
          {selected?.label ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={theme.colors.textMuted} />
      </Pressable>
      {error ? <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}

      <Modal transparent visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={[styles.overlay, { backgroundColor: theme.colors.overlay }]} onPress={() => setOpen(false)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: theme.colors.surface }]}
            onPress={e => e.stopPropagation()}
          >
            <View style={styles.handle} />
            <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>{label ?? placeholder}</Text>
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {options.map(option => {
                const active = option.value === value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    style={[
                      styles.option,
                      {
                        backgroundColor: active ? theme.colors.primarySoft : 'transparent',
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <View style={styles.optionText}>
                      <Text style={[styles.optionLabel, { color: theme.colors.text }]}>{option.label}</Text>
                      {option.hint ? (
                        <Text style={[styles.optionHint, { color: theme.colors.textMuted }]}>{option.hint}</Text>
                      ) : null}
                    </View>
                    {active ? (
                      <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary} />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  field: {
    minHeight: 52,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: { fontSize: 15 },
  error: { fontSize: 12, marginTop: 6 },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '72%',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 10,
  },
  handle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  list: { maxHeight: 460 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionText: { flex: 1, paddingRight: 12 },
  optionLabel: { fontSize: 15, fontWeight: '600' },
  optionHint: { fontSize: 12, marginTop: 2 },
});
