# Database and Row Level Security

## Migrations

| File | Purpose |
| --- | --- |
| `supabase/migrations/20261106090000_init_schema.sql` | Tables, indexes, `updated_at` triggers |
| `supabase/migrations/20261106090100_rls_policies.sql` | RLS, ownership helpers, admin-only catalogue writes, grants |
| `supabase/seed/0001_food_catalogue.sql` | 48 foods, 48 servings, 768 city price estimates |

Apply with `supabase db push`, then run the seed with `psql` or the SQL editor.
The seed is idempotent and can be re-run after edits.

## Tables

### Identity and goals

- `profiles` - one row per user (`id` references `auth.users`). Includes name,
  date of birth, sex, height (`height_value`/`height_unit`), weight
  (`current_weight_value`/`weight_unit`), country, city, language and display
  units. The client always stores canonical cm/kg.
- `user_goals` - goal type, target weight, activity level, optional target date.
- `user_preferences` - diet type, allergies, excluded ingredients, disliked and
  preferred foods, cooking constraints, meal schedule.
- `user_budgets` - daily or monthly amount, currency, country and city. Monthly
  budgets are converted with a 30-day month (`amount / 30`) in both the client
  and shared Edge Function code.

There is no automatic profile trigger. Onboarding is shown while no profile row
exists. Do not add a signup trigger unless the onboarding flow is changed.

### Food catalogue

- `food_items` - canonical name, localized names, category, dietary and allergen
  tags, meal types, nutrition per 100 g, preparation notes, source, `is_active`,
  `country_availability`.
- `food_servings` - household serving name and grams for a food item.
- `food_prices` - city/country price observations with quantity and unit,
  source and validity dates. More than one price per food and city is allowed;
  the client and Edge Functions pick the city match, then any country match.

The seed prices are estimates dated 2026-11-05 and valid until 2026-12-05. They
are not live market prices.

### Plans

- `meal_plans` - owner, title, date range, `goal_snapshot`, `budget_snapshot`,
  currency, status (`active`/`archived`) and `generation_metadata` (AI source,
  warnings, targets, disclaimer).
- `meal_plan_days` - one row per plan day with target calories and estimated
  cost. Unique on `(meal_plan_id, plan_date)`.
- `meal_plan_items` - food reference, denormalized food name, meal type, grams,
  nutrition at plan time, estimated cost, instructions and completion status.

Generating a new plan marks the user's other active plans as `archived`. Plan
items cascade-delete with their day and plan.

### Tracking

- `food_logs` - consumed food snapshot with meal type and macros.
- `weight_logs` - weight value/unit and measurement time.
- `water_logs` - millilitres consumed.
- `user_favorites` - optional food or plan-item favourite.
- `grocery_lists` / `grocery_list_items` - generated shopping list per plan.

### Admin

- `admin_users` - user IDs allowed to modify the food catalogue. Membership is
  added only with the service role or SQL editor, never from the app.

## Ownership model

All user data is protected by RLS. Child tables use security-definer helpers so
policy checks do not recurse:

| Table | Policy |
| --- | --- |
| `profiles` | select/insert/update/delete where `auth.uid() = id` |
| `user_goals`, `user_preferences`, `user_budgets` | all where `auth.uid() = user_id` |
| `meal_plans` | all where `auth.uid() = user_id` |
| `meal_plan_days` | all via `owns_meal_plan(meal_plan_id)` |
| `meal_plan_items` | all via `owns_meal_plan_day(meal_plan_day_id)` |
| `food_logs`, `weight_logs`, `water_logs` | all where `auth.uid() = user_id` |
| `user_favorites` | all where `auth.uid() = user_id`, item must also be owned |
| `grocery_lists` | all where `auth.uid() = user_id` |
| `grocery_list_items` | all via `owns_grocery_list(grocery_list_id)` |
| `food_items`, `food_servings`, `food_prices` | public read for active items; write only when `is_admin()` |
| `admin_users` | select own row or any row if admin; no client writes |

Helpers: `public.is_admin()`, `public.owns_meal_plan(uuid)`,
`public.owns_meal_plan_day(uuid)`, `public.owns_meal_plan_item(uuid)`,
`public.owns_grocery_list(uuid)`.

The service-role key bypasses RLS. It is used only by `delete-account` and by
project operators for seeding and admin setup.

## Account deletion

`delete-account` calls `auth.admin.deleteUser(user.id)`. Foreign keys use
`on delete cascade` from `auth.users` for profile, goals, preferences, budget,
plans, logs, favourites and grocery lists, so user data is removed with the auth
user. Catalogue rows are unaffected.

## Common queries

Check the active plan for a user (as that user, RLS applies):

```sql
select *
from public.meal_plans
where user_id = auth.uid() and status = 'active'
order by created_at desc
limit 1;
```

Add an admin:

```sql
insert into public.admin_users (user_id)
select id from auth.users where email = 'owner@example.com'
on conflict (user_id) do nothing;
```

Inspect stale prices:

```sql
select f.name_en, p.city, p.price_amount, p.observed_at, p.valid_until
from public.food_prices p
join public.food_items f on f.id = p.food_item_id
where p.valid_until < current_date
order by p.valid_until;
```

## Changing the schema

1. Create a new timestamped migration in `supabase/migrations/`.
2. Keep RLS enabled and add ownership policies for any new user table.
3. Update `src/types/index.ts` and `src/services/data/api.ts` mappers when
   column names change.
4. Mirror any nutrition or budget rule change in both `src/utils/` and
   `supabase/functions/_shared/`.
5. Run `npm run typecheck`, `npm run lint` and `npm test`.
