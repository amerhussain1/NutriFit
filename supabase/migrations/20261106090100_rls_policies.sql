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
