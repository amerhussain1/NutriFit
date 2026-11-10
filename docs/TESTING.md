# Testing

## Automated checks

```powershell
npm run typecheck
npm run lint
npm test -- --runInBand
```

Current status:

- `tsc --noEmit` passes.
- ESLint passes with five inline-style/nested-component warnings in existing UI
  files (no errors).
- Jest: 5 suites, 30 tests passing.

Jest uses `@react-native/jest-preset` plus:

- `jest.setup.js` mocks native modules (config, storage, Google Sign-In,
  localize, icons, SVG, charts).
- `jest.config.js` maps ESM-only `react-redux` and `immer` to their CJS builds
  and transforms React Navigation packages.
- `App.test.tsx` mounts the whole app in demo mode.

## Test files

| File | Coverage |
| --- | --- |
| `__tests__/nutrition.test.ts` | Age, BMR, safe calorie targets, minor handling, macros, quantity scaling, food-log rescaling, water |
| `__tests__/budget.test.ts` | Daily budget conversion, food cost, stale price detection, validation, totals |
| `__tests__/plan.test.ts` | Diet/allergy/dislike filtering, 7-day generation, low-budget scaling, replacement filters, grocery aggregation |
| `__tests__/validation.test.ts` | Login, signup, reset, personal info, goal and budget schemas |
| `__tests__/App.test.tsx` | Full app render in demo mode |

Add tests next to these when changing nutrition, budget or plan rules. Keep the
rules mirrored in `src/utils/` and `supabase/functions/_shared/`; a change in one
place without the other is a bug.

## Backend checks

Deno and the Supabase CLI are not installed in this workspace, so the Edge
Functions were not type-checked or deployed here. With the CLI installed:

```powershell
supabase db lint
deno check supabase/functions/**/index.ts
supabase functions serve
```

`deno check` resolves the `https://esm.sh` imports over the network and needs
Deno 2.x. Run it in CI with network access.

### Two-user RLS check

`supabase/tests/rls_two_users.sql` creates two temporary auth users, writes rows
as each user, verifies that neither can read or modify the other's profile, food
logs, plans or private rows, checks that normal users cannot write catalogue
data or promote themselves to admin, and rolls everything back.

Run it in the Supabase SQL editor or with:

```powershell
supabase db execute --file supabase/tests/rls_two_users.sql
```

The script must finish without an exception. It has not been executed in this
workspace because the Supabase CLI and a linked project are unavailable.

## Manual test matrix

### Demo mode (no backend)

- [ ] Fresh install shows the auth screen; demo option enters the app.
- [ ] Onboarding saves profile, goal, preferences and budget.
- [ ] Generate a 7-day plan; days show meals, calories and cost.
- [ ] Replace a meal for each reason; plan totals update.
- [ ] Toggle a meal complete; progress updates.
- [ ] Add food, water and weight logs; progress screen reflects them.
- [ ] Edit a food-log quantity and meal; daily totals and macros update.
- [ ] Delete a food log; daily totals and macros update.
- [ ] Open the budget dashboard; remaining and weekly estimates match the plan.
- [ ] Add/remove a favourite.
- [ ] Generate and check off a grocery list.
- [ ] Change language and units; values convert without data loss.
- [ ] Restart the app; demo data and settings persist.
- [ ] Delete the account; local data is cleared.

### Connected mode

- [ ] Sign up; onboarding appears because no profile exists.
- [ ] Finish onboarding; rows exist in `profiles`, `user_goals`,
  `user_preferences`, `user_budgets`.
- [ ] Generate a plan; one `meal_plans` row is active and older plans are
  archived.
- [ ] Confirm another user cannot read the first user's plan IDs.
- [ ] Force a stale or missing price and confirm a warning appears.
- [ ] Set an allergy and confirm neither Gemini nor fallback includes it.
- [ ] Remove `GEMINI_API_KEY`; plan generation still succeeds with a warning.
- [ ] Restore the key; `generation_metadata.source` becomes `gemini`.
- [ ] Google Sign-In succeeds and creates/uses the Supabase user.
- [ ] Delete the account; `auth.users` row and dependent rows are gone.
- [ ] As a non-admin, attempt a catalogue insert through the API; RLS rejects it.
- [ ] As an admin (row in `admin_users`), the Admin tab appears.

### Failure paths

- [ ] Invalid login shows a readable message.
- [ ] Missing `.env` keeps the app in demo mode instead of crashing.
- [ ] Network loss during sync shows an error, not a blank screen.
- [ ] Gemini timeout returns the fallback plan.
- [ ] `delete-account` without a bearer token returns 401.
- [ ] `generate-diet-plan` before onboarding returns `profile_missing`.

## Security review before release

- [ ] Rotate the exposed database password, service-role key and Gemini key.
- [ ] `git status` shows no `.env`, `google-services.json` or keystore.
- [ ] Search the repo for `service_role`, `GEMINI_API_KEY=` values and database
  URLs; only documentation placeholders should appear.
- [ ] Verify RLS is enabled on all tables and no policy uses `using (true)` for
  user tables.
- [ ] Confirm the service-role key is used only in `delete-account`.
