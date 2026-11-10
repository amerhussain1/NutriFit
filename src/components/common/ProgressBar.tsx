import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useAppTheme } from '../../theme';

type Props = {
  value: number;
  max: number;
  color?: string;
  height?: number;
  trackColor?: string;
};

export default function ProgressBar({ value, max, color, height = 8, trackColor }: Props) {
  const theme = useAppTheme();
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  return (
    <View
      style={[
        styles.track,
        { height, backgroundColor: trackColor ?? theme.colors.border, borderRadius: height },
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${ratio * 100}%`,
            backgroundColor: color ?? theme.colors.primary,
            borderRadius: height,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
  fill: { height: '100%' },
});
