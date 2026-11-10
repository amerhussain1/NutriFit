-- Two-user RLS verification for NutriFit.
--
-- Run after applying both migrations. This script creates two temporary auth
-- users, writes rows as each user, verifies isolation, and rolls everything
-- back. It is safe to re-run.
--
-- Supabase SQL editor: open a new query, paste this file, run it.
-- Supabase CLI: supabase db execute --file supabase/tests/rls_two_users.sql
--
-- Expected result: the transaction ends with ROLLBACK and no exception. Any
-- "RLS verification failed" exception means a policy needs fixing.

begin;

delete from auth.users
where id in (
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222'
);

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-4111-8111-111111111111',
    'authenticated',
    'authenticated',
    'rls-user-a@example.test',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    '',
    '',
    '',
    '',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-4222-8222-222222222222',
    'authenticated',
    'authenticated',
    'rls-user-b@example.test',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    '',
    '',
    '',
    '',
    now(),
    now()
  );

insert into public.food_items (
  id,
  canonical_name,
  name_en,
  category,
  dietary_tags,
  allergen_tags,
  meal_types,
  calories_per_100g,
  protein_per_100g,
  carbs_per_100g,
  fat_per_100g,
  is_active
)
values
  (
    '33333333-3333-4333-8333-333333333333',
    'rls test active food',
    'RLS Test Active Food',
    'Other',
    array['vegetarian'],
    array[]::text[],
    array['lunch'],
    100,
    5,
    10,
    2,
    true
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    'rls test inactive food',
    'RLS Test Inactive Food',
    'Other',
    array['vegetarian'],
    array[]::text[],
    array['lunch'],
    100,
    5,
    10,
    2,
    false
  );

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

insert into public.profiles (
  id,
  full_name,
  date_of_birth,
  sex,
  height_value,
  current_weight_value,
  country_code,
  city,
  preferred_language,
  units
)
values (
  '11111111-1111-4111-8111-111111111111',
  'RLS User A',
  '1995-05-10',
  'male',
  175,
  70,
  'PK',
  'Karachi',
  'en',
  'metric'
);

insert into public.user_budgets (
  user_id,
  budget_period,
  amount,
  currency_code,
  country_code,
  city
)
values (
  '11111111-1111-4111-8111-111111111111',
  'daily',
  800,
  'PKR',
  'PK',
  'Karachi'
);

insert into public.food_logs (
  user_id,
  food_name,
  meal_type,
  quantity_grams,
  calories_snapshot,
  protein_snapshot,
  carbs_snapshot,
  fat_snapshot
)
values (
  '11111111-1111-4111-8111-111111111111',
  'User A lunch',
  'lunch',
  150,
  300,
  12,
  40,
  8
);

insert into public.weight_logs (user_id, weight_value, measured_at)
values ('11111111-1111-4111-8111-111111111111', 70, now());

insert into public.water_logs (user_id, quantity_ml, consumed_at)
values ('11111111-1111-4111-8111-111111111111', 500, now());

insert into public.user_favorites (user_id, name)
values ('11111111-1111-4111-8111-111111111111', 'User A favorite');

insert into public.grocery_lists (id, user_id, meal_plan_id, title)
values (
  '88888888-8888-4888-8888-888888888888',
  '11111111-1111-4111-8111-111111111111',
  '55555555-5555-4555-8555-555555555555',
  'User A grocery list'
);

insert into public.grocery_list_items (
  id,
  grocery_list_id,
  name,
  quantity,
  unit,
  estimated_cost
)
values (
  '99999999-9999-4999-8999-999999999999',
  '88888888-8888-4888-8888-888888888888',
  'RLS Test Rice',
  1000,
  'g',
  100
);

insert into public.meal_plans (
  id,
  user_id,
  title,
  start_date,
  end_date,
  currency_code
)
values (
  '55555555-5555-4555-8555-555555555555',
  '11111111-1111-4111-8111-111111111111',
  'RLS test plan',
  current_date,
  current_date + 6,
  'PKR'
);

insert into public.meal_plan_days (
  id,
  meal_plan_id,
  plan_date,
  target_calories,
  estimated_cost,
  currency_code
)
values (
  '66666666-6666-4666-8666-666666666666',
  '55555555-5555-4555-8555-555555555555',
  current_date,
  2000,
  800,
  'PKR'
);

insert into public.meal_plan_items (
  id,
  meal_plan_day_id,
  food_item_id,
  food_name,
  meal_type,
  quantity_grams,
  calories,
  protein,
  carbohydrates,
  fat,
  estimated_cost
)
values (
  '77777777-7777-4777-8777-777777777777',
  '66666666-6666-4666-8666-666666666666',
  '33333333-3333-4333-8333-333333333333',
  'RLS Test Lunch',
  'lunch',
  150,
  150,
  7.5,
  15,
  3,
  120
);

do $$
begin
  if (select count(*) from public.profiles) <> 1 then
    raise exception 'RLS verification failed: user A cannot read their own profile';
  end if;
  if (select count(*) from public.food_logs) <> 1 then
    raise exception 'RLS verification failed: user A cannot read their own food log';
  end if;
  if (select count(*) from public.meal_plans) <> 1 then
    raise exception 'RLS verification failed: user A cannot read their own meal plan';
  end if;
  if (select count(*) from public.meal_plan_items) <> 1 then
    raise exception 'RLS verification failed: user A cannot read their own meal plan items';
  end if;
  if (select count(*) from public.user_budgets) <> 1 then
    raise exception 'RLS verification failed: user A cannot read their own budget';
  end if;
  if (select count(*) from public.water_logs) <> 1 then
    raise exception 'RLS verification failed: user A cannot read their own water logs';
  end if;
  if (select count(*) from public.weight_logs) <> 1 then
    raise exception 'RLS verification failed: user A cannot read their own weight logs';
  end if;
  if (select count(*) from public.user_favorites) <> 1 then
    raise exception 'RLS verification failed: user A cannot read their own favorites';
  end if;
  if (select count(*) from public.grocery_lists) <> 1 then
    raise exception 'RLS verification failed: user A cannot read their own grocery list';
  end if;
  if (select count(*) from public.grocery_list_items) <> 1 then
    raise exception 'RLS verification failed: user A cannot read their own grocery items';
  end if;
end $$;

select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',
  true
);

insert into public.profiles (
  id,
  full_name,
  date_of_birth,
  sex,
  height_value,
  current_weight_value,
  country_code,
  city,
  preferred_language,
  units
)
values (
  '22222222-2222-4222-8222-222222222222',
  'RLS User B',
  '1998-02-14',
  'female',
  162,
  60,
  'PK',
  'Lahore',
  'en',
  'metric'
);

do $$
declare
  affected integer;
begin
  if (select count(*) from public.profiles) <> 1 then
    raise exception 'RLS verification failed: user B can see another profile';
  end if;

  if (select count(*) from public.food_logs) <> 0 then
    raise exception 'RLS verification failed: user B can see user A food logs';
  end if;

  if (select count(*) from public.meal_plans) <> 0 then
    raise exception 'RLS verification failed: user B can see user A meal plans';
  end if;

  if (select count(*) from public.meal_plan_items) <> 0 then
    raise exception 'RLS verification failed: user B can see user A meal plan items';
  end if;

  if (select count(*) from public.user_budgets) <> 0 then
    raise exception 'RLS verification failed: user B can see user A budgets';
  end if;

  if (select count(*) from public.water_logs) <> 0 then
    raise exception 'RLS verification failed: user B can see user A water logs';
  end if;

  if (select count(*) from public.weight_logs) <> 0 then
    raise exception 'RLS verification failed: user B can see user A weight logs';
  end if;

  if (select count(*) from public.user_favorites) <> 0 then
    raise exception 'RLS verification failed: user B can see user A favorites';
  end if;

  if (select count(*) from public.grocery_lists) <> 0 then
    raise exception 'RLS verification failed: user B can see user A grocery lists';
  end if;

  if (select count(*) from public.grocery_list_items) <> 0 then
    raise exception 'RLS verification failed: user B can see user A grocery items';
  end if;

  begin
    insert into public.grocery_list_items (grocery_list_id, name, quantity, unit)
    values ('88888888-8888-4888-8888-888888888888', 'Forged item', 100, 'g');
    raise exception 'RLS verification failed: user B can insert items into user A grocery list';
  exception
    when insufficient_privilege then
      null;
  end;

  update public.meal_plans
  set title = 'Hijacked'
  where user_id = '11111111-1111-4111-8111-111111111111';
  get diagnostics affected = row_count;
  if affected <> 0 then
    raise exception 'RLS verification failed: user B can update user A meal plans';
  end if;

  begin
    insert into public.meal_plan_items (
      meal_plan_day_id,
      food_name,
      meal_type,
      quantity_grams
    )
    values (
      '66666666-6666-4666-8666-666666666666',
      'Forged meal',
      'dinner',
      100
    );
    raise exception 'RLS verification failed: user B can insert items into user A plan';
  exception
    when insufficient_privilege then
      null;
  end;

  update public.food_logs
  set calories_snapshot = 1
  where user_id = '11111111-1111-4111-8111-111111111111';
  get diagnostics affected = row_count;
  if affected <> 0 then
    raise exception 'RLS verification failed: user B can update user A food logs';
  end if;

  update public.profiles
  set full_name = 'Hacked'
  where id = '11111111-1111-4111-8111-111111111111';
  get diagnostics affected = row_count;
  if affected <> 0 then
    raise exception 'RLS verification failed: user B can update user A profile';
  end if;

  begin
    insert into public.food_logs (
      user_id,
      food_name,
      meal_type,
      quantity_grams,
      calories_snapshot,
      protein_snapshot,
      carbs_snapshot,
      fat_snapshot
    )
    values (
      '11111111-1111-4111-8111-111111111111',
      'Forged entry',
      'dinner',
      100,
      100,
      1,
      1,
      1
    );
    raise exception 'RLS verification failed: user B can insert a food log for user A';
  exception
    when insufficient_privilege then
      null;
  end;

  begin
    insert into public.food_items (
      canonical_name,
      name_en,
      category,
      meal_types
    )
    values ('rls forbidden food', 'RLS Forbidden Food', 'Other', array['lunch']);
    raise exception 'RLS verification failed: a normal user can write catalogue foods';
  exception
    when insufficient_privilege then
      null;
  end;

  begin
    insert into public.admin_users (user_id)
    values ('22222222-2222-4222-8222-222222222222');
    raise exception 'RLS verification failed: a normal user can promote themselves to admin';
  exception
    when insufficient_privilege then
      null;
  end;
end $$;

reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

do $$
begin
  if (select count(*) from public.food_items where id = '33333333-3333-4333-8333-333333333333') <> 1 then
    raise exception 'RLS verification failed: anonymous users cannot read active foods';
  end if;
  if (select count(*) from public.food_items where id = '44444444-4444-4444-8444-444444444444') <> 0 then
    raise exception 'RLS verification failed: anonymous users can read inactive foods';
  end if;
end $$;

rollback;
