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
