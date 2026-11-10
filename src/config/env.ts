import Config from 'react-native-config';

export const ENV = {
  supabaseUrl: Config.SUPABASE_URL ?? '',
  supabasePublishableKey: Config.SUPABASE_PUBLISHABLE_KEY ?? '',
  googleWebClientId: Config.GOOGLE_WEB_CLIENT_ID ?? '',
  geminiModel: Config.GEMINI_MODEL ?? 'gemini-2.5-flash',
};

export const isSupabaseConfigured =
  ENV.supabaseUrl.startsWith('https://') &&
  ENV.supabasePublishableKey.length > 20;

export const isGoogleConfigured = ENV.googleWebClientId.endsWith('.apps.googleusercontent.com');
