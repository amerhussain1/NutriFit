import { useColorScheme } from 'react-native';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

export const palette = {
  orange: '#FF7A00',
  orangeDark: '#E56A00',
  orangeSoft: '#FFF1E7',
  amber: '#FFC837',
  green: '#22C55E',
  greenDark: '#16A34A',
  greenSoft: '#E9F9EF',
  red: '#EF4444',
  redSoft: '#FDECEC',
  amberSoft: '#FFF7E0',
  blue: '#3B82F6',
  blueSoft: '#EAF2FF',
  white: '#FFFFFF',
  black: '#000000',
};

export interface AppColors {
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceAlt: string;
  surfaceElevated: string;
  text: string;
  textMuted: string;
  textInverse: string;
  border: string;
  borderStrong: string;
  primary: string;
  primaryDark: string;
  primarySoft: string;
  accent: string;
  accentSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  info: string;
  infoSoft: string;
  overlay: string;
  shadow: string;
}

export const lightColors: AppColors = {
  background: '#FFF8F1',
  backgroundAlt: '#FFF4E6',
  surface: '#FFFFFF',
  surfaceAlt: '#FFF7ED',
  surfaceElevated: '#FFFFFF',
  text: '#111827',
  textMuted: '#6B7280',
  textInverse: '#FFFFFF',
  border: '#F3E8DD',
  borderStrong: '#E7D8C8',
  primary: palette.orange,
  primaryDark: palette.orangeDark,
  primarySoft: palette.orangeSoft,
  accent: palette.green,
  accentSoft: palette.greenSoft,
  success: palette.greenDark,
  successSoft: palette.greenSoft,
  warning: '#D97706',
  warningSoft: palette.amberSoft,
  danger: palette.red,
  dangerSoft: palette.redSoft,
  info: palette.blue,
  infoSoft: palette.blueSoft,
  overlay: 'rgba(17,24,39,0.45)',
  shadow: '#1F1100',
};

export const darkColors: AppColors = {
  background: '#121215',
  backgroundAlt: '#17171B',
  surface: '#1E1E24',
  surfaceAlt: '#24242B',
  surfaceElevated: '#2A2A32',
  text: '#F9FAFB',
  textMuted: '#A1A1AA',
  textInverse: '#111827',
  border: '#33333D',
  borderStrong: '#44444F',
  primary: '#FF9633',
  primaryDark: '#FFB25E',
  primarySoft: '#3A2A1B',
  accent: '#4ADE80',
  accentSoft: '#163222',
  success: '#4ADE80',
  successSoft: '#163222',
  warning: '#FBBF24',
  warningSoft: '#3A2F14',
  danger: '#F87171',
  dangerSoft: '#3A1D1D',
  info: '#60A5FA',
  infoSoft: '#1B2A44',
  overlay: 'rgba(0,0,0,0.6)',
  shadow: '#000000',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 28,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: '800' as const },
  h1: { fontSize: 28, lineHeight: 34, fontWeight: '800' as const },
  h2: { fontSize: 22, lineHeight: 28, fontWeight: '800' as const },
  h3: { fontSize: 18, lineHeight: 24, fontWeight: '700' as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '600' as const },
  small: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  caption: { fontSize: 11, lineHeight: 15, fontWeight: '600' as const },
};

export interface AppTheme {
  dark: boolean;
  colors: AppColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
}

export function useAppTheme(): AppTheme {
  const system = useColorScheme();
  const mode = useSelector((s: RootState) => s.settings.themeMode);
  const dark = mode === 'system' ? system === 'dark' : mode === 'dark';
  return {
    dark,
    colors: dark ? darkColors : lightColors,
    spacing,
    radius,
    typography,
  };
}
