# Development status

Last updated: 2026-11-06

## Complete

### App

- Auth screens (email/password, Google entry point, demo mode), onboarding,
  profile settings, language (English, Urdu, Roman Urdu), units (metric/imperial).
- Home dashboard, budget dashboard, 7-day plan, meal detail and replacement,
  food catalogue and detail, food-log edit/delete, favourites, grocery list,
  progress (weight/water/calories), admin stats.
- Redux Toolkit state, i18next localisation, theme tokens, reusable components.
- Demo mode backed by AsyncStorage; all data functions have a local branch.
- Client API layer for profiles, goals, preferences, budgets, foods, plans,
  logs, water, weight, favourites, grocery lists, admin status and Edge Function
  calls.

### Backend

- Initial schema migration with 17 tables, indexes and `updated_at` triggers.
- Full RLS migration: ownership policies, security-definer helper functions,
  catalogue read/admin-write policies, admin membership.
- Two-user RLS verification script at `supabase/tests/rls_two_users.sql`.
- Generated seed: 48 foods, 48 servings, 768 PK/IN city price estimates.
- Shared Edge Function modules for HTTP/CORS, Supabase clients, context loading,
  food mapping, nutrition, planning, Gemini, and persistence.
- Edge Functions:
  - `generate-diet-plan` - Gemini structured JSON with strict server validation
    and deterministic fallback; archives older plans.
  - `replace-meal` - validates reasons and ownership, updates item and day cost.
  - `suggest-food-alternatives` - filtered catalogue alternatives.
  - `explain-meal` - Gemini explanation with template fallback.
  - `delete-account` - service-role auth deletion, cascades remove user data.

### Project setup

- `.env.example` with client-only variables and server-secret guidance.
- `.gitignore` covers `.env*`, `google-services.json`, keystores and Supabase
  local state.
- `react-native-config` wired into Gradle; optional Google Services plugin is
  applied only when `google-services.json` exists.
- `npm run typecheck`, `npm run seed:catalogue`; Jest configured with native
  mocks.
- Docs: setup, database/RLS, Google Sign-In, Gemini, testing, README.

### Verification

```text
npm run typecheck   pass (no errors)
npm run lint        pass (0 errors, 5 existing UI warnings)
npm test            5 suites, 30 tests passing
```

## Owner actions still required

These cannot be done in this workspace because they need credentials or external
services:

1. Rotate the exposed database password, service-role/secret key and Gemini key.
2. Create/link the Supabase project and run `supabase db push`.
3. Apply `supabase/seed/0001_food_catalogue.sql`.
4. Deploy the five Edge Functions.
5. Run `supabase/tests/rls_two_users.sql` against the deployed database.
6. Configure the Google OAuth web and Android clients, add the web client ID to
   `.env`, and optionally add `android/app/google-services.json`.
7. Build and install on a device; validate email auth, Google auth, plan
   generation with and without Gemini, and account deletion.
8. Add an admin row in `admin_users` if catalogue administration is needed.

## Known limitations

- The Supabase project was not deployed and no live database, auth, function or
  Gemini request was executed.
- The two-user RLS script was added but cannot be executed here without the
  Supabase CLI and a linked project.
- Deno and the Supabase CLI are unavailable here, so Edge Functions were reviewed
  manually but not `deno check`ed.
- Android/iOS native builds were not run. The iOS Google URL scheme and Firebase
  file are not configured.
- Food prices are estimate data dated 2026-11-05 with validity to 2026-12-05,
  not live prices.
- The admin screen is read-only stats today. Catalogue write grants and RLS
  policies exist for a future editor.
- `suggest-food-alternatives` and `explain-meal` are implemented but the current
  client screens do not call them yet.
- No server-side rate limiting on AI generation; add it before high-volume use.
- Native Google Sign-In and deep links require manual device validation.

## Suggested next work

1. Deploy and smoke-test the backend with rotated credentials.
2. Run the manual matrix in [docs/TESTING.md](docs/TESTING.md).
3. Wire `explain-meal` into meal detail and alternatives into replacement.
4. Add catalogue editing UI for admins.
5. Add AI rate limiting and price refresh tooling.
6. Configure iOS Google Sign-In and release signing.
