# NutriFit

NutriFit is a budget-aware, 7-day diet planner for Pakistan and India. It builds
affordable meal plans from a local food catalogue, lets users log meals, water
and weight, and uses Gemini only as an optional enhancement behind a Supabase
Edge Function. When Supabase or Gemini is not configured the app runs in a
fully local demo mode.

## Stack

- React Native 0.85 + React 19 + TypeScript
- Redux Toolkit, React Navigation, React Hook Form + Zod
- Supabase Postgres, Auth, Row Level Security and Edge Functions (Deno)
- Gemini 2.5 Flash via a server-side Edge Function only
- Local fallback storage through AsyncStorage

## Quick start

```powershell
npm install
npm run android
```

Without a `.env` file the app starts in demo mode and stores everything locally
on the device. Use the demo option on the sign-in screen to explore all screens.

To connect a real backend:

```powershell
Copy-Item .env.example .env
# fill in SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY and GOOGLE_WEB_CLIENT_ID
npm run android
```

`react-native-config` is wired into Gradle, so a native rebuild is required after
changing `.env`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm start` | Start Metro |
| `npm run android` | Build and run Android |
| `npm run typecheck` | TypeScript check (`tsc --noEmit`) |
| `npm run lint` | ESLint |
| `npm test` | Jest test suite |
| `npm run seed:catalogue` | Regenerate the SQL food seed from `src/constants/foodSeed.ts` |

## Backend setup

The backend lives in `supabase/`:

- `migrations/` - schema and RLS policies
- `seed/0001_food_catalogue.sql` - starter catalogue with city price estimates
- `functions/` - `generate-diet-plan`, `replace-meal`,
  `suggest-food-alternatives`, `explain-meal`, `delete-account`

Follow [docs/SETUP.md](docs/SETUP.md) for the full walkthrough. In short:

```powershell
supabase link --project-ref <project-ref>
supabase db push
supabase secrets set GEMINI_API_KEY=<new-key> GEMINI_MODEL=gemini-2.5-flash
supabase functions deploy
```

Apply the seed with `psql` or the Supabase SQL editor after the migrations:

```powershell
psql $env:DATABASE_URL -f supabase/seed/0001_food_catalogue.sql
```

## Security notice

Credentials were shared in plain text during planning. Before using this project
with real data, rotate the database password, the Supabase secret/service-role
key and the Gemini API key. Never put the database password, service-role key or
Gemini key in `.env`, the app bundle or git. See
[docs/SETUP.md](docs/SETUP.md#security-checklist).

## Documentation

- [Setup and deployment](docs/SETUP.md)
- [Database and RLS](docs/DATABASE.md)
- [Google Sign-In](docs/GOOGLE_SIGN_IN.md)
- [Gemini](docs/GEMINI_SETUP.md)
- [Testing](docs/TESTING.md)
- [Development status](DEVELOPMENT_STATUS.md)

## Limitations

- Food prices are estimate data dated 2026-11-05, not live market prices.
- Nutrition and cost figures are guidance, not medical advice.
- The Gemini path falls back to a deterministic plan when the API key is absent
  or the request fails.
- Google Sign-In and live backend flows require owner-provided credentials and
  have not been validated in this workspace.
