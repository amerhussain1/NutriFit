import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import type { AuthUser, SessionInfo } from '../../types';
import { ENV, isGoogleConfigured, isSupabaseConfigured } from '../../config/env';
import { supabase } from '../supabase/client';
import { clearLocalData, getDemoUser, setDemoUser } from '../data/localStore';

let googleConfigured = false;

export function configureGoogleSignIn(): void {
  if (googleConfigured || !isGoogleConfigured) {
    return;
  }
  GoogleSignin.configure({
    webClientId: ENV.googleWebClientId,
    scopes: ['profile', 'email'],
    offlineAccess: false,
  });
  googleConfigured = true;
}

function mapUser(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): AuthUser {
  const name =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    null;
  return { id: user.id, email: user.email ?? null, fullName: name };
}

export async function getSession(): Promise<SessionInfo | null> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.user) {
      return null;
    }
    return {
      user: mapUser(data.session.user),
      accessToken: data.session.access_token,
    };
  }
  const demo = await getDemoUser();
  return demo ? { user: demo, accessToken: 'demo' } : null;
}

export function onAuthStateChange(
  callback: (session: SessionInfo | null) => void,
): () => void {
  if (!isSupabaseConfigured || !supabase) {
    return () => undefined;
  }
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(
      session?.user
        ? { user: mapUser(session.user), accessToken: session.access_token }
        : null,
    );
  });
  return () => data.subscription.unsubscribe();
}

export async function signInWithEmail(email: string, password: string): Promise<SessionInfo> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('auth.unavailable');
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session || !data.user) {
    throw new Error(error?.message ?? 'auth.failed');
  }
  return { user: mapUser(data.user), accessToken: data.session.access_token };
}

export async function signUpWithEmail(params: {
  email: string;
  password: string;
  fullName: string;
}): Promise<{ session: SessionInfo | null; needsEmailConfirmation: boolean }> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('auth.unavailable');
  }
  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: { data: { full_name: params.fullName } },
  });
  if (error) {
    throw new Error(error.message);
  }
  if (!data.session || !data.user) {
    return { session: null, needsEmailConfirmation: true };
  }
  return {
    session: { user: mapUser(data.user), accessToken: data.session.access_token },
    needsEmailConfirmation: false,
  };
}

export async function signInWithGoogle(): Promise<SessionInfo> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('auth.unavailable');
  }
  configureGoogleSignIn();
  if (!isGoogleConfigured) {
    throw new Error('auth.unavailable');
  }
  try {
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    const idToken =
      (response as { data?: { idToken?: string | null } }).data?.idToken ??
      (response as { idToken?: string | null }).idToken;
    if (!idToken) {
      throw new Error('auth.googleTokenMissing');
    }
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });
    if (error || !data.session || !data.user) {
      throw new Error(error?.message ?? 'auth.failed');
    }
    return { user: mapUser(data.user), accessToken: data.session.access_token };
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error('auth.cancelled');
    }
    if (code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('auth.playServices');
    }
    throw error instanceof Error ? error : new Error('auth.failed');
  }
}

export async function signInDemo(): Promise<SessionInfo> {
  const user: AuthUser = {
    id: 'demo-user',
    email: 'demo@nutrifit.local',
    fullName: 'Demo User',
  };
  await setDemoUser(user);
  return { user, accessToken: 'demo' };
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut();
  }
  await setDemoUser(null);
}

export async function resetPassword(email: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('auth.unavailable');
  }
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteAccount(): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.functions.invoke('delete-account', { body: {} });
    if (error) {
      throw new Error(error.message);
    }
    await supabase.auth.signOut();
  }
  await clearLocalData();
}

export { statusCodes };
