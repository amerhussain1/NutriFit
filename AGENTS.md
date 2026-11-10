# AGENTS.md

Guidance for agents working in this repository.

## Project

NutriFit is a React Native 0.85 + TypeScript app with a Supabase backend
(Postgres, Auth, RLS, Deno Edge Functions) and an optional Gemini integration.
The Android application ID is `com.dietplanner`.

## Commands

```powershell
npm install
npm run android
npm start
npm run typecheck   # tsc --noEmit
npm run lint        # eslint .
npm test -- --runInBand
npm run seed:catalogue
```

There is no separate formatting script. Prettier config is in `.prettierrc.js`.

## Layout

- `src/` - app source (screens, components, store, services, utils, theme, i18n)
- `App.tsx` - provider, bootstrap, navigator
- `src/AppBootstrap.tsx` - settings hydration, auth init, boot gate
- `src/services/data/api.ts` - data layer; local demo and Supabase branches
- `src/services/data/localStore.ts` - AsyncStorage demo state
- `src/services/supabase/client.ts` - client created only when configured
- `src/utils/` - nutrition, budget, plan, validation, units, formatting
- `src/constants/foodSeed.ts` - TypeScript food catalogue used in demo mode
- `supabase/migrations/` - schema and RLS
- `supabase/seed/0001_food_catalogue.sql` - generated SQL seed
- `supabase/functions/_shared/` - shared Deno modules
- `docs/` - setup, database, auth, Gemini and testing docs

`Screens/` and `Component/` are legacy/ignored directories, not app source.

## Conventions

- TypeScript strict mode. Prefer explicit types at module boundaries.
- Follow existing Redux Toolkit slice and thunk patterns.
- Keep the demo path working: every data function needs a local branch when
  Supabase is not configured.
- Mirror nutrition/budget/plan rules between `src/utils/` and
  `supabase/functions/_shared/`. If one changes, change both.
- Do not add code comments unless they explain a non-obvious invariant.
- UI text goes through i18next (`src/localization/`). Do not hardcode user-facing
  English strings in new screens.
- Reuse existing components (`Button`, `Input`, `Card`, `Screen`, etc.) and theme
  tokens instead of raw colors.

## Database rules

- RLS is enabled on every table. New user tables need ownership policies.
- `public.is_admin()` gates catalogue writes. Admin membership is added only via
  the service role/SQL editor.
- No signup trigger creates profiles; onboarding depends on the profile being
  absent.
- Cascades from `auth.users` remove user data on account deletion.
- Apply schema changes as new timestamped migrations; do not edit deployed
  migrations.

## Edge Function rules

- Use the caller's JWT client (`createUserClient`) for all user operations so RLS
  applies.
- Use the service-role client only for admin auth operations such as
  `delete-account`.
- Validate and recalculate all AI output server-side. Never trust Gemini for
  nutrition, cost, food IDs, diet rules or allergies.
- Return CORS headers on every response and handle `OPTIONS`.
- Keep `verify_jwt = true` in `supabase/config.toml`.

## Security invariants

- Never commit `.env`, `google-services.json`, keystores, database passwords,
  service-role keys or Gemini keys.
- Client env may contain only `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and
  `GOOGLE_WEB_CLIENT_ID`.
- Credentials shared during planning are considered compromised and must be
  rotated by the owner.
- Do not weaken RLS or add `using (true)` to user tables.

## Testing expectations

- Run `npm run typecheck`, `npm run lint` and `npm test -- --runInBand` before
  finishing a change.
- Add or update tests for nutrition, budget, plan safety and validation rules.
- Native Google Sign-In, Supabase deployment and live Gemini calls cannot be
  validated without owner credentials. Document any manual steps instead of
  inventing results.

## Known environment limits

- Deno and the Supabase CLI are not installed in this workspace. Edge Functions
  are excluded from `tsconfig.json` and `.eslintignore`; check them with
  `deno check`/`supabase` where available.
- Jest needs the native-module mocks in `jest.setup.js`; add a mock there when a
  new native dependency is imported at app startup.
