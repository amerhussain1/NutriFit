import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';
import { getLocales } from 'react-native-localize';
import en from './en.json';
import ur from './ur.json';
import romanUr from './roman-ur.json';

const deviceLanguage = getLocales()[0]?.languageCode ?? 'en';

I18nManager.allowRTL(true);

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ur: { translation: ur },
    'roman-ur': { translation: romanUr },
  },
  lng: deviceLanguage === 'ur' ? 'ur' : 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;

export function isRTLLanguage(language: string): boolean {
  return language === 'ur';
}
