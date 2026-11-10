import { createClient, type SupabaseClient, type User } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { HttpError } from './http.ts';

export function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new HttpError(500, `Missing server secret: ${name}`, 'missing_secret');
  }
  return value;
}

export function supabaseUrl(): string {
  return requireEnv('SUPABASE_URL');
}

function anonKey(): string {
  return Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? '';
}

/**
 * Creates a Supabase client that acts as the calling user. Row Level Security
 * therefore applies exactly as it does for the mobile client.
 */
export function createUserClient(req: Request): SupabaseClient {
  const authorization = req.headers.get('Authorization') ?? '';
  if (!authorization.toLowerCase().startsWith('bearer ')) {
    throw new HttpError(401, 'Missing bearer token.', 'unauthorized');
  }
  const key = anonKey();
  if (!key) {
    throw new HttpError(500, 'Missing SUPABASE_ANON_KEY.', 'missing_secret');
  }
  return createClient(supabaseUrl(), key, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Service-role client. Never send this client or its key to the app. */
export function createServiceClient(): SupabaseClient {
  return createClient(supabaseUrl(), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function requireUser(client: SupabaseClient): Promise<User> {
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) {
    throw new HttpError(401, 'You must be signed in.', 'unauthorized');
  }
  return data.user;
}
