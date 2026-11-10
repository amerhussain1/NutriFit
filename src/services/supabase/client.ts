import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { ENV, isSupabaseConfigured } from '../../config/env';

let client: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  client = createClient(ENV.supabaseUrl, ENV.supabasePublishableKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

export const supabase = client;

export function requireSupabase(): SupabaseClient {
  if (!client) {
    throw new Error('Supabase is not configured. Add SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY to .env.');
  }
  return client;
}
