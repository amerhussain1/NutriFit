import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../theme';

export default function DemoBanner() {
  const theme = useAppTheme();
  const { t } = useTranslation();
  return (
    <View style={[styles.banner, { backgroundColor: theme.colors.warningSoft }]}>
      <Ionicons name="flask-outline" size={15} color={theme.colors.warning} />
      <Text style={[styles.text, { color: theme.colors.warning }]}>{t('demo.banner')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 12,
  },
  text: { fontSize: 11, fontWeight: '700', marginLeft: 7, flex: 1 },
});
