# Setup and deployment

## Prerequisites

- Node.js >= 22.11 and npm
- Android Studio / Android SDK, JDK 17+
- Supabase CLI (optional but required for deployment)
- `psql` or access to the Supabase SQL editor for the seed file
- A Supabase project and, optionally, a Gemini API key

Google Sign-In is optional for local demo mode. See
[GOOGLE_SIGN_IN.md](GOOGLE_SIGN_IN.md) before configuring it.

## 1. Install dependencies

```powershell
npm install
```

## 2. Run in demo mode (no backend)

```powershell
npm run android
```

If `.env` is absent, `isSupabaseConfigured` is false and the app uses
AsyncStorage. Sign in with the demo option to exercise plans, logs, grocery
lists, favourites and progress without network access.

## 3. Configure the client environment

```powershell
Copy-Item .env.example .env
```

Fill in:

| Variable | Where to find it |
| --- | --- |
| `SUPABASE_URL` | Supabase project settings -> API |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase project settings -> API keys (safe for clients with RLS) |
| `GOOGLE_WEB_CLIENT_ID` | Google Cloud console -> OAuth web client |

Never add `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_PASSWORD` or
`GEMINI_API_KEY` to `.env`. `.env` is ignored by git; `.env.example` is not.

Rebuild the native app after changing `.env`:

```powershell
npm run android
```

`android/app/build.gradle` applies `react-native-config`'s `dotenv.gradle`, which
is required for values to reach the JS bundle.

## 4. Create the database

Link the project and push migrations:

```powershell
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

This creates the schema and RLS policies in `supabase/migrations/`.

There is intentionally no trigger that creates a profile on signup. Onboarding
uses the absence of a profile to decide whether to show the onboarding flow.

## 5. Seed the food catalogue

The seed contains 48 foods, 48 servings and 768 city price estimates for the
supported Pakistani and Indian cities. It is generated from
`src/constants/foodSeed.ts` by `npm run seed:catalogue`.

Apply it once after the migrations:

```powershell
psql $env:DATABASE_URL -f supabase/seed/0001_food_catalogue.sql
```

Or paste the file into the Supabase SQL editor. If you edit the TypeScript seed,
regenerate the SQL and re-apply only the affected rows.

Prices are estimates observed on 2026-11-05 with `valid_until` set to
2026-12-05. The app marks missing or stale prices in plan warnings.

## 6. Configure Edge Function secrets

Supabase injects `SUPABASE_URL`, `SUPABASE_ANON_KEY` /
`SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SERVICE_ROLE_KEY` into deployed
functions automatically. Add the Gemini secret only if AI is enabled:

```powershell
supabase secrets set GEMINI_API_KEY=<rotated-key> GEMINI_MODEL=gemini-2.5-flash
```

The service-role key must exist only as a function secret. The functions use it
only in `delete-account`; all other operations use the caller's JWT so RLS
applies.

## 7. Deploy the functions

```powershell
supabase functions deploy generate-diet-plan
supabase functions deploy replace-meal
supabase functions deploy suggest-food-alternatives
supabase functions deploy explain-meal
supabase functions deploy delete-account
```

All functions require a valid JWT. CORS preflight requests are handled inside
each function.

## 8. Configure authentication

1. In Supabase Auth settings, enable Email/Password.
2. Set the site URL to `http://localhost:3000`.
3. Add `nutrifit://auth-callback` to additional redirect URLs if you add deep
   links later.
4. Enable the Google provider only after completing
   [GOOGLE_SIGN_IN.md](GOOGLE_SIGN_IN.md).

Email confirmation can stay enabled. The client handles unconfirmed accounts and
surfaces the Supabase error.

## 9. Create the first admin (optional)

Admins can manage the food catalogue. There is no client-side way to become an
admin. After the user has signed up, run this in the SQL editor with the
service role or as the project owner:

```sql
insert into public.admin_users (user_id)
select id from auth.users where email = 'owner@example.com'
on conflict (user_id) do nothing;
```

The `Admin` tab appears when `public.is_admin()` returns true.

## Security checklist

- [ ] Rotate the exposed database password in Supabase project settings.
- [ ] Rotate the exposed service-role / secret key and update function secrets.
- [ ] Rotate the exposed Gemini API key and `supabase secrets set GEMINI_API_KEY=...`.
- [ ] Confirm `.env` and `google-services.json` are not tracked: `git status`.
- [ ] Confirm no secret appears in `src/`, `android/` or committed files.
- [ ] Keep RLS enabled on every table and do not add `using (true)` policies.
- [ ] Restrict the Google OAuth client to the Android package and SHA-1.

## Troubleshooting

- **Values are undefined in JS**: rebuild after editing `.env`; Metro alone does
  not reload native config.
- **Build fails on `react-native-config`**: confirm the `apply from` line near the
  top of `android/app/build.gradle`.
- **Google Sign-In DEVELOPER_ERROR**: the SHA-1 or package name does not match
  the OAuth client. See [GOOGLE_SIGN_IN.md](GOOGLE_SIGN_IN.md).
- **Functions return `catalogue_empty`**: the seed was not applied.
- **Functions return `profile_missing`**: finish onboarding before generating a
  plan.
- **No AI output**: check `GEMINI_API_KEY`; the deterministic fallback still
  returns a valid plan and the response includes a warning.
