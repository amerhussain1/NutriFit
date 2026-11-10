import React, { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from './localization/i18n';
import { store } from './store';
import { useAppDispatch } from './store/hooks';
import { hydrateSettings, setLanguage } from './store/slices/settingsSlice';
import { initializeAuth, setSession } from './store/slices/authSlice';
import { configureGoogleSignIn, onAuthStateChange } from './services/auth/authService';
import BootScreen from './components/common/BootScreen';
import type { AppSettings } from './types';

const SETTINGS_KEY = 'nutrifit.settings.v1';

type Props = { children: React.ReactNode };

export default function AppBootstrap({ children }: Props) {
  const dispatch = useAppDispatch();
  const [ready, setReady] = useState(false);
  const readyRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SETTINGS_KEY);
        if (raw) {
          const settings = JSON.parse(raw) as Partial<AppSettings>;
          dispatch(hydrateSettings(settings));
          if (settings.language) {
            dispatch(setLanguage(settings.language));
            await i18n.changeLanguage(settings.language);
          }
        }
      } catch {
        // Defaults are used if settings cannot be read.
      } finally {
        if (mounted) {
          readyRef.current = true;
          setReady(true);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [dispatch]);

  useEffect(() => {
    configureGoogleSignIn();
    dispatch(initializeAuth());
    const unsubscribe = onAuthStateChange(session => {
      dispatch(setSession(session));
    });
    return unsubscribe;
  }, [dispatch]);

  useEffect(() => {
    let previous = store.getState().settings;
    const unsubscribe = store.subscribe(() => {
      const current = store.getState().settings;
      if (readyRef.current && current !== previous) {
        previous = current;
        AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(current)).catch(() => undefined);
      }
    });
    return unsubscribe;
  }, []);

  return ready ? <>{children}</> : <BootScreen />;
}
