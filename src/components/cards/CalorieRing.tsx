import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../theme';

type Props = {
  consumed: number;
  target: number;
  size?: number;
  remainingLabel?: string;
};

export default function CalorieRing({ consumed, target, size = 154, remainingLabel }: Props) {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = target > 0 ? Math.min(1, Math.max(0, consumed / target)) : 0;
  const remaining = Math.max(0, Math.round(target - consumed));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.colors.border}
          strokeWidth={stroke}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.colors.primary}
          strokeWidth={stroke}
          fill="transparent"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - ratio)}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={[styles.center, { width: size, height: size }]}>
        <Text style={[styles.value, { color: theme.colors.text }]}>{remaining}</Text>
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>
          {remainingLabel ?? t('home.remaining')}
        </Text>
        <Text style={[styles.sub, { color: theme.colors.textMuted }]}>
          {Math.round(consumed)} / {Math.round(target)} kcal
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: 30, fontWeight: '800' },
  label: { fontSize: 11, fontWeight: '700', marginTop: -2 },
  sub: { fontSize: 10, marginTop: 5 },
});
