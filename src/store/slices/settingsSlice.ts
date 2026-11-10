import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AppSettings, Language, ThemeMode, UnitSystem } from '../../types';

const initialState: AppSettings = {
  language: 'en',
  themeMode: 'system',
  units: 'metric',
  honestMode: true,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    hydrateSettings(state, action: PayloadAction<Partial<AppSettings>>) {
      return { ...state, ...action.payload };
    },
    setLanguage(state, action: PayloadAction<Language>) {
      state.language = action.payload;
    },
    setThemeMode(state, action: PayloadAction<ThemeMode>) {
      state.themeMode = action.payload;
    },
    setUnits(state, action: PayloadAction<UnitSystem>) {
      state.units = action.payload;
    },
  },
});

export const { hydrateSettings, setLanguage, setThemeMode, setUnits } =
  settingsSlice.actions;
export default settingsSlice.reducer;
