-- NutriFit complete setup (schema + RLS)
-- Paste into Supabase SQL Editor for project ref nelxdqlcykxczetftd

-- NutriFit core schema.
-- All user-owned tables reference auth.users and are protected by RLS in the
-- following migration. Food catalogue tables are shared reference data.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles and preferences
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  date_of_birth date,
  sex text not null default 'other' check (sex in ('male', 'female', 'other')),
  height_value numeric(5, 1) check (height_value is null or height_value between 60 and 260),
  height_unit text not null default 'cm' check (height_unit in ('cm', 'in')),
  current_weight_value numeric(5, 1) check (current_weight_value is null or current_weight_value between 20 and 400),
  weight_unit text not null default 'kg' check (weight_unit in ('kg', 'lb')),
  country_code text check (country_code in ('PK', 'IN')),
  city text,
  preferred_language text not null default 'en' check (preferred_language in ('en', 'ur', 'roman-ur')),
  units text not null default 'metric' check (units in ('metric', 'imperial')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  goal_type text not null default 'maintain' check (goal_type in ('loss', 'gain', 'maintain')),
  target_weight numeric(5, 1) check (target_weight is null or target_weight between 20 and 400),
  target_date date,
  activity_level text not null default 'moderate'
    check (activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  diet_type text not null default 'non_vegetarian'
    check (diet_type in ('vegetarian', 'non_vegetarian', 'eggetarian', 'vegan')),
  allergies text[] not null default '{}',
  excluded_ingredients text[] not null default '{}',
  disliked_foods text[] not null default '{}',
  preferred_foods text[] not null default '{}',
  cooking_constraints text[] not null default '{}',
  meal_schedule text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  budget_period text not null default 'daily' check (budget_period in ('daily', 'monthly')),
  amount numeric(12, 2) not null default 0 check (amount >= 0),
  currency_code text not null default 'PKR' check (currency_code in ('PKR', 'INR')),
  country_code text not null default 'PK' check (country_code in ('PK', 'IN')),
  city text not null default '',
  effective_from date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Food catalogue
-- ---------------------------------------------------------------------------

create table if not exists public.food_items (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null unique,
  name_en text not null,
  name_ur text,
  name_roman_ur text,
  name_hi text,
  country_availability text[] not null default '{}',
  category text not null default 'Other',
  dietary_tags text[] not null default '{}',
  allergen_tags text[] not null default '{}',
  meal_types text[] not null default '{}',
  calories_per_100g numeric(8, 2) not null default 0 check (calories_per_100g >= 0),
  protein_per_100g numeric(8, 2) not null default 0 check (protein_per_100g >= 0),
  carbs_per_100g numeric(8, 2) not null default 0 check (carbs_per_100g >= 0),
  fat_per_100g numeric(8, 2) not null default 0 check (fat_per_100g >= 0),
  fiber_per_100g numeric(8, 2) check (fiber_per_100g is null or fiber_per_100g >= 0),
  preparation_notes text,
  source_name text,
  source_reference text,
  verified_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.food_servings (
  id uuid primary key default gen_random_uuid(),
  food_item_id uuid not null references public.food_items (id) on delete cascade,
  serving_name text not null,
  grams numeric(8, 2) not null check (grams > 0),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.food_prices (
  id uuid primary key default gen_random_uuid(),
  food_item_id uuid not null references public.food_items (id) on delete cascade,
  country_code text not null check (country_code in ('PK', 'IN')),
  city text,
  price_amount numeric(12, 2) not null check (price_amount >= 0),
  currency_code text not null check (currency_code in ('PKR', 'INR')),
  quantity_amount numeric(12, 2) not null default 1000 check (quantity_amount > 0),
  quantity_unit text not null default 'g' check (quantity_unit in ('g', 'kg', 'ml', 'l', 'piece')),
  price_source text not null default 'Seed estimate',
  observed_at timestamptz not null default now(),
  valid_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Diet plans
-- ---------------------------------------------------------------------------

create table if not exists public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  start_date date not null,
  end_date date not null,
  goal_snapshot jsonb not null default '{}'::jsonb,
  budget_snapshot jsonb not null default '{}'::jsonb,
  currency_code text not null default 'PKR' check (currency_code in ('PKR', 'INR')),
  status text not null default 'active' check (status in ('active', 'archived')),
  generation_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meal_plan_days (
  id uuid primary key default gen_random_uuid(),
  meal_plan_id uuid not null references public.meal_plans (id) on delete cascade,
  plan_date date not null,
  target_calories numeric(8, 2) not null default 0,
  estimated_cost numeric(12, 2) not null default 0,
  currency_code text not null default 'PKR' check (currency_code in ('PKR', 'INR')),
  unique (meal_plan_id, plan_date)
);

create table if not exists public.meal_plan_items (
  id uuid primary key default gen_random_uuid(),
  meal_plan_day_id uuid not null references public.meal_plan_days (id) on delete cascade,
  food_item_id uuid references public.food_items (id) on delete set null,
  food_name text not null default 'Meal',
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  quantity_grams numeric(8, 2) not null default 0 check (quantity_grams > 0),
  serving_description text not null default '',
  calories numeric(8, 2) not null default 0,
  protein numeric(8, 2) not null default 0,
  carbohydrates numeric(8, 2) not null default 0,
  fat numeric(8, 2) not null default 0,
  estimated_cost numeric(12, 2) not null default 0,
  preparation_instructions text not null default '',
  completion_status boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Tracking
-- ---------------------------------------------------------------------------

create table if not exists public.food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  food_item_id uuid references public.food_items (id) on delete set null,
  food_name text not null default 'Food',
  consumed_at timestamptz not null default now(),
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  quantity_grams numeric(8, 2) not null default 0 check (quantity_grams > 0),
  calories_snapshot numeric(8, 2) not null default 0,
  protein_snapshot numeric(8, 2) not null default 0,
  carbs_snapshot numeric(8, 2) not null default 0,
  fat_snapshot numeric(8, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  weight_value numeric(5, 1) not null check (weight_value between 20 and 400),
  weight_unit text not null default 'kg' check (weight_unit in ('kg', 'lb')),
  measured_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  quantity_ml numeric(8, 1) not null check (quantity_ml > 0 and quantity_ml <= 10000),
  consumed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.user_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  food_item_id uuid references public.food_items (id) on delete set null,
  meal_plan_item_id uuid references public.meal_plan_items (id) on delete set null,
  name text not null default 'Saved meal',
  calories numeric(8, 2),
  created_at timestamptz not null default now()
);

create unique index if not exists user_favorites_food_unique
  on public.user_favorites (user_id, food_item_id)
  where food_item_id is not null;
create unique index if not exists user_favorites_plan_item_unique
  on public.user_favorites (user_id, meal_plan_item_id)
  where meal_plan_item_id is not null;

-- ---------------------------------------------------------------------------
-- Grocery lists
-- ---------------------------------------------------------------------------

create table if not exists public.grocery_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  meal_plan_id uuid references public.meal_plans (id) on delete set null,
  title text not null default 'Grocery list',
  status text not null default 'open' check (status in ('open', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.grocery_list_items (
  id uuid primary key default gen_random_uuid(),
  grocery_list_id uuid not null references public.grocery_lists (id) on delete cascade,
  food_item_id uuid references public.food_items (id) on delete set null,
  name text not null default 'Item',
  quantity numeric(10, 2) not null default 0 check (quantity >= 0),
  unit text not null default 'g',
  estimated_cost numeric(12, 2) not null default 0,
  purchased boolean not null default false,
  price_stale boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Server-side administrator authorization
-- Membership is managed with the service role / SQL editor only, never from
-- the mobile client.
-- ---------------------------------------------------------------------------

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists meal_plans_user_id_idx on public.meal_plans (user_id);
create index if not exists meal_plans_user_status_idx on public.meal_plans (user_id, status);
create index if not exists meal_plan_days_plan_idx on public.meal_plan_days (meal_plan_id);
create index if not exists meal_plan_items_day_idx on public.meal_plan_items (meal_plan_day_id);
create index if not exists meal_plan_items_food_idx on public.meal_plan_items (food_item_id);
create index if not exists food_logs_user_consumed_idx on public.food_logs (user_id, consumed_at desc);
create index if not exists weight_logs_user_measured_idx on public.weight_logs (user_id, measured_at desc);
create index if not exists water_logs_user_consumed_idx on public.water_logs (user_id, consumed_at desc);
create index if not exists user_favorites_user_idx on public.user_favorites (user_id);
create index if not exists grocery_lists_user_idx on public.grocery_lists (user_id);
create index if not exists grocery_list_items_list_idx on public.grocery_list_items (grocery_list_id);
create index if not exists food_items_active_idx on public.food_items (is_active);
create index if not exists food_items_category_idx on public.food_items (category);
create index if not exists food_servings_food_idx on public.food_servings (food_item_id);
create index if not exists food_prices_food_idx on public.food_prices (food_item_id);
create index if not exists food_prices_location_idx on public.food_prices (country_code, city);
create index if not exists food_prices_valid_until_idx on public.food_prices (valid_until);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists user_goals_set_updated_at on public.user_goals;
create trigger user_goals_set_updated_at
  before update on public.user_goals
  for each row execute function public.set_updated_at();

drop trigger if exists user_preferences_set_updated_at on public.user_preferences;
create trigger user_preferences_set_updated_at
  before update on public.user_preferences
  for each row execute function public.set_updated_at();

drop trigger if exists user_budgets_set_updated_at on public.user_budgets;
create trigger user_budgets_set_updated_at
  before update on public.user_budgets
  for each row execute function public.set_updated_at();

drop trigger if exists food_items_set_updated_at on public.food_items;
create trigger food_items_set_updated_at
  before update on public.food_items
  for each row execute function public.set_updated_at();

drop trigger if exists food_prices_set_updated_at on public.food_prices;
create trigger food_prices_set_updated_at
  before update on public.food_prices
  for each row execute function public.set_updated_at();

drop trigger if exists meal_plans_set_updated_at on public.meal_plans;
create trigger meal_plans_set_updated_at
  before update on public.meal_plans
  for each row execute function public.set_updated_at();

drop trigger if exists meal_plan_items_set_updated_at on public.meal_plan_items;
create trigger meal_plan_items_set_updated_at
  before update on public.meal_plan_items
  for each row execute function public.set_updated_at();

drop trigger if exists grocery_lists_set_updated_at on public.grocery_lists;
create trigger grocery_lists_set_updated_at
  before update on public.grocery_lists
  for each row execute function public.set_updated_at();

drop trigger if exists grocery_list_items_set_updated_at on public.grocery_list_items;
create trigger grocery_list_items_set_updated_at
  before update on public.grocery_list_items
  for each row execute function public.set_updated_at();


-- Row Level Security for NutriFit.
-- Every user-owned table is protected by ownership checks. The food catalogue
-- is publicly readable only for active records and writable only by users
-- listed in admin_users (managed with the service role / SQL editor).

-- ---------------------------------------------------------------------------
-- Server-side helpers (security definer avoids recursive RLS lookups)
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

create or replace function public.owns_meal_plan(plan_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.meal_plans
    where id = plan_id and user_id = auth.uid()
  );
$$;

create or replace function public.owns_meal_plan_day(day_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.meal_plan_days d
    join public.meal_plans p on p.id = d.meal_plan_id
    where d.id = day_id and p.user_id = auth.uid()
  );
$$;

create or replace function public.owns_meal_plan_item(item_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.meal_plan_items i
    join public.meal_plan_days d on d.id = i.meal_plan_day_id
    join public.meal_plans p on p.id = d.meal_plan_id
    where i.id = item_id and p.user_id = auth.uid()
  );
$$;

create or replace function public.owns_grocery_list(list_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.grocery_lists
    where id = list_id and user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.owns_meal_plan(uuid) from public;
revoke all on function public.owns_meal_plan_day(uuid) from public;
revoke all on function public.owns_meal_plan_item(uuid) from public;
revoke all on function public.owns_grocery_list(uuid) from public;

grant execute on function public.is_admin() to authenticated, anon;
grant execute on function public.owns_meal_plan(uuid) to authenticated, anon;
grant execute on function public.owns_meal_plan_day(uuid) to authenticated, anon;
grant execute on function public.owns_meal_plan_item(uuid) to authenticated, anon;
grant execute on function public.owns_grocery_list(uuid) to authenticated, anon;

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.user_goals enable row level security;
alter table public.user_preferences enable row level security;
alter table public.user_budgets enable row level security;
alter table public.food_items enable row level security;
alter table public.food_servings enable row level security;
alter table public.food_prices enable row level security;
alter table public.meal_plans enable row level security;
alter table public.meal_plan_days enable row level security;
alter table public.meal_plan_items enable row level security;
alter table public.food_logs enable row level security;
alter table public.weight_logs enable row level security;
alter table public.water_logs enable row level security;
alter table public.user_favorites enable row level security;
alter table public.grocery_lists enable row level security;
alter table public.grocery_list_items enable row level security;
alter table public.admin_users enable row level security;

-- ---------------------------------------------------------------------------
-- Own-profile / goals / preferences / budget
-- ---------------------------------------------------------------------------

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own" on public.profiles
  for delete to authenticated using (auth.uid() = id);

drop policy if exists "user_goals_all_own" on public.user_goals;
create policy "user_goals_all_own" on public.user_goals
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_preferences_all_own" on public.user_preferences;
create policy "user_preferences_all_own" on public.user_preferences
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_budgets_all_own" on public.user_budgets;
create policy "user_budgets_all_own" on public.user_budgets
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Meal plans, days and items
-- ---------------------------------------------------------------------------

drop policy if exists "meal_plans_all_own" on public.meal_plans;
create policy "meal_plans_all_own" on public.meal_plans
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "meal_plan_days_all_via_plan" on public.meal_plan_days;
create policy "meal_plan_days_all_via_plan" on public.meal_plan_days
  for all to authenticated
  using (public.owns_meal_plan(meal_plan_id))
  with check (public.owns_meal_plan(meal_plan_id));

drop policy if exists "meal_plan_items_all_via_day" on public.meal_plan_items;
create policy "meal_plan_items_all_via_day" on public.meal_plan_items
  for all to authenticated
  using (public.owns_meal_plan_day(meal_plan_day_id))
  with check (public.owns_meal_plan_day(meal_plan_day_id));

-- ---------------------------------------------------------------------------
-- Tracking tables
-- ---------------------------------------------------------------------------

drop policy if exists "food_logs_all_own" on public.food_logs;
create policy "food_logs_all_own" on public.food_logs
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "weight_logs_all_own" on public.weight_logs;
create policy "weight_logs_all_own" on public.weight_logs
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "water_logs_all_own" on public.water_logs;
create policy "water_logs_all_own" on public.water_logs
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_favorites_all_own" on public.user_favorites;
create policy "user_favorites_all_own" on public.user_favorites
  for all to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (meal_plan_item_id is null or public.owns_meal_plan_item(meal_plan_item_id))
  );

-- ---------------------------------------------------------------------------
-- Grocery lists
-- ---------------------------------------------------------------------------

drop policy if exists "grocery_lists_all_own" on public.grocery_lists;
create policy "grocery_lists_all_own" on public.grocery_lists
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "grocery_list_items_all_via_list" on public.grocery_list_items;
create policy "grocery_list_items_all_via_list" on public.grocery_list_items
  for all to authenticated
  using (public.owns_grocery_list(grocery_list_id))
  with check (public.owns_grocery_list(grocery_list_id));

-- ---------------------------------------------------------------------------
-- Shared food catalogue
-- ---------------------------------------------------------------------------

drop policy if exists "food_items_read_active" on public.food_items;
create policy "food_items_read_active" on public.food_items
  for select to anon, authenticated using (is_active = true);

drop policy if exists "food_items_admin_insert" on public.food_items;
create policy "food_items_admin_insert" on public.food_items
  for insert to authenticated with check (public.is_admin());

drop policy if exists "food_items_admin_update" on public.food_items;
create policy "food_items_admin_update" on public.food_items
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "food_items_admin_delete" on public.food_items;
create policy "food_items_admin_delete" on public.food_items
  for delete to authenticated using (public.is_admin());

drop policy if exists "food_servings_read_active" on public.food_servings;
create policy "food_servings_read_active" on public.food_servings
  for select to anon, authenticated
  using (exists (
    select 1 from public.food_items f
    where f.id = food_item_id and f.is_active = true
  ));

drop policy if exists "food_servings_admin_write" on public.food_servings;
create policy "food_servings_admin_write" on public.food_servings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "food_prices_read_active" on public.food_prices;
create policy "food_prices_read_active" on public.food_prices
  for select to anon, authenticated
  using (exists (
    select 1 from public.food_items f
    where f.id = food_item_id and f.is_active = true
  ));

drop policy if exists "food_prices_admin_write" on public.food_prices;
create policy "food_prices_admin_write" on public.food_prices
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Admin membership
-- Users may only confirm their own admin status. Adding/removing admins is a
-- service-role / SQL-editor operation.
-- ---------------------------------------------------------------------------

drop policy if exists "admin_users_select_self_or_admin" on public.admin_users;
create policy "admin_users_select_self_or_admin" on public.admin_users
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- Explicit table grants (RLS still applies)
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;
grant select on public.food_items, public.food_servings, public.food_prices to anon, authenticated;
grant select, insert, update, delete on
  public.profiles,
  public.user_goals,
  public.user_preferences,
  public.user_budgets,
  public.meal_plans,
  public.meal_plan_days,
  public.meal_plan_items,
  public.food_logs,
  public.weight_logs,
  public.water_logs,
  public.user_favorites,
  public.grocery_lists,
  public.grocery_list_items
to authenticated;
grant select on public.admin_users to authenticated;

-- Catalogue writes are granted at the SQL layer but still gated by the
-- is_admin() policies above.
grant insert, update, delete on
  public.food_items,
  public.food_servings,
  public.food_prices
to authenticated;

