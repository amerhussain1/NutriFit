import { isSupabaseConfigured } from '../../config/env';
import { getSeedFoods } from '../../constants/foodSeed';
import type {
  AppStateSnapshot,
  BudgetPeriod,
  DailyTargets,
  FoodItem,
  FoodLog,
  GroceryList,
  MealPlan,
  MealPlanDay,
  MealPlanItem,
  MealType,
  Profile,
  ReplacementRequest,
  UserBudget,
  UserGoal,
  UserPreferences,
  WaterLog,
  WeightLog,
} from '../../types';
import {
  buildGroceryList,
  generateLocalPlan,
  replaceMealItem,
  replacementCandidates,
} from '../../utils/plan';
import { supabase } from '../supabase/client';
import {
  emptyLocalState,
  loadLocalState,
  saveLocalState,
  updateLocalState,
  type LocalState,
} from './localStore';

function shouldUseLocal(userId: string): boolean {
  return !isSupabaseConfigured || userId === 'demo-user';
}

function requireClient() {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }
  return supabase;
}

function mapProfile(row: Record<string, any>): Profile {
  return {
    id: row.id,
    fullName: row.full_name ?? '',
    dateOfBirth: row.date_of_birth ?? '1995-01-01',
    sex: row.sex ?? 'other',
    heightCm: Number(row.height_value ?? 170),
    weightKg: Number(row.current_weight_value ?? 70),
    countryCode: row.country_code ?? 'PK',
    city: row.city ?? 'Karachi',
    language: row.preferred_language ?? 'en',
    units: row.units ?? 'metric',
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  };
}

function mapFoodRow(row: Record<string, any>, countryCode: string, city: string): FoodItem {
  const prices = Array.isArray(row.food_prices) ? row.food_prices : [];
  const price =
    prices.find(
      (p: Record<string, any>) =>
        p.city?.toLowerCase() === city.toLowerCase() && p.country_code === countryCode,
    ) ?? prices.find((p: Record<string, any>) => p.country_code === countryCode);
  const servings = Array.isArray(row.food_servings) ? row.food_servings : [];
  const serving = servings[0];

  let pricePerKg = 0;
  if (price) {
    const amount = Number(price.price_amount ?? 0);
    const quantity = Number(price.quantity_amount ?? 1) || 1;
    const unit = String(price.quantity_unit ?? 'kg').toLowerCase();
    if (unit === 'kg' || unit === 'l') {
      pricePerKg = (amount / quantity) * 1;
    } else if (unit === 'g' || unit === 'ml') {
      pricePerKg = (amount / quantity) * 1000;
    } else {
      pricePerKg = (amount / quantity) * 1000;
    }
  }

  return {
    id: row.id,
    canonicalName: row.canonical_name ?? row.name_en,
    nameEn: row.name_en ?? row.canonical_name,
    nameUr: row.name_ur,
    nameRomanUr: row.name_roman_ur,
    nameHi: row.name_hi,
    category: row.category ?? 'Other',
    dietaryTags: row.dietary_tags ?? [],
    allergenTags: row.allergen_tags ?? [],
    mealTypes: row.meal_types ?? ['breakfast', 'lunch', 'dinner', 'snack'],
    caloriesPer100g: Number(row.calories_per_100g ?? 0),
    proteinPer100g: Number(row.protein_per_100g ?? 0),
    carbsPer100g: Number(row.carbs_per_100g ?? 0),
    fatPer100g: Number(row.fat_per_100g ?? 0),
    fiberPer100g: row.fiber_per_100g != null ? Number(row.fiber_per_100g) : null,
    servingName: serving?.serving_name ?? '100g',
    servingGrams: Number(serving?.grams ?? 100),
    pricePerKg: Math.round(pricePerKg * 100) / 100,
    currencyCode: price?.currency_code ?? (countryCode === 'PK' ? 'PKR' : 'INR'),
    priceSource: price?.price_source ?? 'Local price unavailable',
    priceObservedAt: price?.observed_at ?? new Date(0).toISOString(),
    priceValidUntil: price?.valid_until ?? null,
    sourceName: row.source_name ?? 'Unknown source',
    verified: Boolean(row.verified_at),
    instructions: row.preparation_notes ?? undefined,
  };
}

function mapPlanItem(row: Record<string, any>): MealPlanItem {
  return {
    id: row.id,
    foodItemId: row.food_item_id,
    foodName: row.food_name ?? row.food_items?.name_en ?? 'Meal',
    mealType: row.meal_type,
    quantityGrams: Number(row.quantity_grams ?? 0),
    servingDescription: row.serving_description ?? '',
    calories: Number(row.calories ?? 0),
    protein: Number(row.protein ?? 0),
    carbs: Number(row.carbohydrates ?? 0),
    fat: Number(row.fat ?? 0),
    estimatedCost: Number(row.estimated_cost ?? 0),
    preparationInstructions: row.preparation_instructions ?? '',
    completionStatus: Boolean(row.completion_status),
  };
}

function mapPlan(row: Record<string, any>): MealPlan {
  const days: MealPlanDay[] = (row.meal_plan_days ?? [])
    .slice()
    .sort((a: Record<string, any>, b: Record<string, any>) =>
      String(a.plan_date).localeCompare(String(b.plan_date)),
    )
    .map((day: Record<string, any>) => ({
      id: day.id,
      planDate: day.plan_date,
      targetCalories: Number(day.target_calories ?? 0),
      estimatedCost: Number(day.estimated_cost ?? 0),
      currencyCode: day.currency_code ?? row.currency_code ?? 'PKR',
      items: (day.meal_plan_items ?? []).map(mapPlanItem),
    }));

  return {
    id: row.id,
    title: row.title,
    startDate: row.start_date,
    endDate: row.end_date,
    goalSnapshot: {
      goalType: row.goal_snapshot?.goalType ?? row.goal_snapshot?.goal_type ?? 'maintain',
      targetWeightKg: row.goal_snapshot?.targetWeightKg ?? 0,
      activityLevel: row.goal_snapshot?.activityLevel ?? 'moderate',
    },
    budgetSnapshot: {
      budgetPeriod: row.budget_snapshot?.budgetPeriod ?? 'daily',
      amount: row.budget_snapshot?.amount ?? 0,
      currencyCode: row.currency_code ?? 'PKR',
      countryCode: 'PK',
      city: '',
    },
    currencyCode: row.currency_code ?? 'PKR',
    status: row.status ?? 'active',
    days,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

export async function fetchFoods(profile: Profile): Promise<FoodItem[]> {
  if (!isSupabaseConfigured || !supabase) {
    return getSeedFoods(profile.countryCode, profile.city);
  }
  const { data, error } = await supabase
    .from('food_items')
    .select('*, food_servings(*), food_prices(*)')
    .eq('is_active', true)
    .contains('country_availability', [profile.countryCode]);
  if (error || !data) {
    return getSeedFoods(profile.countryCode, profile.city);
  }
  const mapped = data.map(row => mapFoodRow(row, profile.countryCode, profile.city));
  return mapped.filter(food => food.caloriesPer100g > 0);
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  if (shouldUseLocal(userId)) {
    const state = await loadLocalState();
    return state.profile;
  }
  const client = requireClient();
  const { data, error } = await client.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error || !data) {
    return null;
  }
  return mapProfile(data);
}

export async function saveProfile(userId: string, profile: Profile): Promise<void> {
  if (shouldUseLocal(userId)) {
    await updateLocalState(state => ({ ...state, profile: { ...profile, id: userId } }));
    return;
  }
  const client = requireClient();
  const { error } = await client.from('profiles').upsert({
    id: userId,
    full_name: profile.fullName,
    date_of_birth: profile.dateOfBirth,
    sex: profile.sex,
    height_value: profile.heightCm,
    height_unit: 'cm',
    current_weight_value: profile.weightKg,
    weight_unit: 'kg',
    country_code: profile.countryCode,
    city: profile.city,
    preferred_language: profile.language,
    units: profile.units,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    throw new Error(error.message);
  }
}

export async function saveGoal(userId: string, goal: UserGoal): Promise<void> {
  if (shouldUseLocal(userId)) {
    await updateLocalState(state => ({ ...state, goal }));
    return;
  }
  const client = requireClient();
  const { error } = await client.from('user_goals').upsert(
    {
      user_id: userId,
      goal_type: goal.goalType,
      target_weight: goal.targetWeightKg,
      target_date: goal.targetDate ?? null,
      activity_level: goal.activityLevel,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
  if (error) {
    throw new Error(error.message);
  }
}

export async function savePreferences(
  userId: string,
  preferences: UserPreferences,
): Promise<void> {
  if (shouldUseLocal(userId)) {
    await updateLocalState(state => ({ ...state, preferences }));
    return;
  }
  const client = requireClient();
  const { error } = await client.from('user_preferences').upsert(
    {
      user_id: userId,
      diet_type: preferences.dietType,
      allergies: preferences.allergies,
      excluded_ingredients: preferences.excludedIngredients,
      disliked_foods: preferences.dislikedFoods,
      preferred_foods: preferences.preferredFoods,
      cooking_constraints: preferences.cookingConstraints,
      meal_schedule: preferences.mealSchedule,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
  if (error) {
    throw new Error(error.message);
  }
}

export async function saveBudget(userId: string, budget: UserBudget): Promise<void> {
  if (shouldUseLocal(userId)) {
    await updateLocalState(state => ({ ...state, budget }));
    return;
  }
  const client = requireClient();
  const { error } = await client.from('user_budgets').upsert(
    {
      user_id: userId,
      budget_period: budget.budgetPeriod,
      amount: budget.amount,
      currency_code: budget.currencyCode,
      country_code: budget.countryCode,
      city: budget.city,
      effective_from: new Date().toISOString().slice(0, 10),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
  if (error) {
    throw new Error(error.message);
  }
}

export async function fetchSnapshot(userId: string): Promise<AppStateSnapshot> {
  if (shouldUseLocal(userId)) {
    const state = await loadLocalState();
    return {
      profile: state.profile,
      goal: state.goal,
      preferences: state.preferences,
      budget: state.budget,
      plan: state.plan,
      foodLogs: state.foodLogs,
      weightLogs: state.weightLogs,
      waterLogs: state.waterLogs,
      favorites: state.favorites,
      groceryList: state.groceryList,
    };
  }
  const client = requireClient();
  const profile = await fetchProfile(userId);

  const [goalRes, prefsRes, budgetRes, planRes, logsRes, weightsRes, waterRes, favoritesRes, groceryRes] =
    await Promise.all([
      client.from('user_goals').select('*').eq('user_id', userId).maybeSingle(),
      client.from('user_preferences').select('*').eq('user_id', userId).maybeSingle(),
      client.from('user_budgets').select('*').eq('user_id', userId).maybeSingle(),
      client
        .from('meal_plans')
        .select('*, meal_plan_days(*, meal_plan_items(*))')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      client
        .from('food_logs')
        .select('*')
        .eq('user_id', userId)
        .order('consumed_at', { ascending: false })
        .limit(200),
      client
        .from('weight_logs')
        .select('*')
        .eq('user_id', userId)
        .order('measured_at', { ascending: true })
        .limit(365),
      client
        .from('water_logs')
        .select('*')
        .eq('user_id', userId)
        .order('consumed_at', { ascending: false })
        .limit(200),
      client.from('user_favorites').select('*').eq('user_id', userId),
      client
        .from('grocery_lists')
        .select('*, grocery_list_items(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const goal: UserGoal | null = goalRes.data
    ? {
        goalType: goalRes.data.goal_type,
        targetWeightKg: Number(goalRes.data.target_weight ?? 0),
        activityLevel: goalRes.data.activity_level,
        targetDate: goalRes.data.target_date,
      }
    : null;

  const preferences: UserPreferences | null = prefsRes.data
    ? {
        dietType: prefsRes.data.diet_type,
        allergies: prefsRes.data.allergies ?? [],
        excludedIngredients: prefsRes.data.excluded_ingredients ?? [],
        dislikedFoods: prefsRes.data.disliked_foods ?? [],
        preferredFoods: prefsRes.data.preferred_foods ?? [],
        cookingConstraints: prefsRes.data.cooking_constraints ?? [],
        mealSchedule: prefsRes.data.meal_schedule ?? [],
      }
    : null;

  const budget: UserBudget | null = budgetRes.data
    ? {
        budgetPeriod: budgetRes.data.budget_period,
        amount: Number(budgetRes.data.amount ?? 0),
        currencyCode: budgetRes.data.currency_code,
        countryCode: budgetRes.data.country_code,
        city: budgetRes.data.city,
      }
    : null;

  const foodLogs: FoodLog[] = (logsRes.data ?? []).map(row => ({
    id: row.id,
    foodItemId: row.food_item_id,
    foodName: row.food_name ?? 'Food',
    consumedAt: row.consumed_at,
    mealType: row.meal_type,
    quantityGrams: Number(row.quantity_grams ?? 0),
    calories: Number(row.calories_snapshot ?? 0),
    protein: Number(row.protein_snapshot ?? 0),
    carbs: Number(row.carbs_snapshot ?? 0),
    fat: Number(row.fat_snapshot ?? 0),
  }));

  const weightLogs: WeightLog[] = (weightsRes.data ?? []).map(row => ({
    id: row.id,
    weightKg: Number(row.weight_value ?? 0),
    measuredAt: row.measured_at,
    notes: row.notes,
  }));

  const waterLogs: WaterLog[] = (waterRes.data ?? []).map(row => ({
    id: row.id,
    quantityMl: Number(row.quantity_ml ?? 0),
    consumedAt: row.consumed_at,
  }));

  const favorites = (favoritesRes.data ?? []).map(row => ({
    id: row.id,
    foodItemId: row.food_item_id,
    mealPlanItemId: row.meal_plan_item_id,
    name: row.name ?? 'Saved meal',
    calories: row.calories != null ? Number(row.calories) : undefined,
    createdAt: row.created_at,
  }));

  const groceryList: GroceryList | null = groceryRes.data
    ? {
        id: groceryRes.data.id,
        mealPlanId: groceryRes.data.meal_plan_id,
        title: groceryRes.data.title,
        status: groceryRes.data.status,
        createdAt: groceryRes.data.created_at,
        items: (groceryRes.data.grocery_list_items ?? []).map((row: Record<string, any>) => ({
          id: row.id,
          foodItemId: row.food_item_id,
          name: row.name ?? 'Item',
          quantityGrams: Number(row.quantity ?? 0),
          unit: row.unit ?? 'g',
          estimatedCost: Number(row.estimated_cost ?? 0),
          purchased: Boolean(row.purchased),
          priceStale: Boolean(row.price_stale),
        })),
      }
    : null;

  return {
    profile,
    goal,
    preferences,
    budget,
    plan: planRes.data ? mapPlan(planRes.data) : null,
    foodLogs,
    weightLogs,
    waterLogs,
    favorites,
    groceryList,
  };
}

export async function generatePlan(
  userId: string,
  input: {
    profile: Profile;
    goal: UserGoal;
    preferences: UserPreferences;
    budget: UserBudget;
    targets: DailyTargets;
    foods: FoodItem[];
    startDate?: string;
  },
): Promise<MealPlan> {
  if (shouldUseLocal(userId)) {
    const plan = generateLocalPlan(input);
    await updateLocalState(state => ({ ...state, plan }));
    return plan;
  }
  const client = requireClient();
  const { data, error } = await client.functions.invoke('generate-diet-plan', {
    body: { start_date: input.startDate },
  });
  if (error) {
    throw new Error(error.message);
  }
  if (!data?.plan) {
    throw new Error(data?.error ?? 'Plan generation failed.');
  }
  return mapPlan(data.plan);
}

export async function replaceMeal(
  userId: string,
  plan: MealPlan,
  itemId: string,
  reason: ReplacementRequest['reason'],
  foods: FoodItem[],
  foodItemId?: string,
): Promise<MealPlan> {
  if (shouldUseLocal(userId)) {
    const day = plan.days.find(d => d.items.some(item => item.id === itemId));
    const item = day?.items.find(i => i.id === itemId);
    if (!day || !item) {
      throw new Error('Meal not found.');
    }
    const candidates = replacementCandidates({
      planItem: item,
      reason,
      foods,
      currencyCode: plan.currencyCode,
    });
    const best =
      reason === 'higher_protein'
        ? candidates.slice().sort((a, b) => b.proteinPer100g - a.proteinPer100g)[0]
        : candidates.slice().sort((a, b) => a.pricePerKg - b.pricePerKg)[0];
    const chosen = foodItemId ? candidates.find(food => food.id === foodItemId) : best;
    if (!chosen) {
      throw new Error('replace.none');
    }
    const replacement = replaceMealItem(item, chosen, reason);
    const days = plan.days.map(d =>
      d.id !== day.id
        ? d
        : {
            ...d,
            items: d.items.map(i => (i.id === itemId ? replacement : i)),
            estimatedCost:
              Math.round(
                d.items
                  .map(i => (i.id === itemId ? replacement : i))
                  .reduce((sum, i) => sum + i.estimatedCost, 0) * 10,
              ) / 10,
          },
    );
    const next = { ...plan, days };
    await updateLocalState(state => ({ ...state, plan: next }));
    return next;
  }
  const client = requireClient();
  const { data, error } = await client.functions.invoke('replace-meal', {
    body: { meal_plan_item_id: itemId, reason, food_item_id: foodItemId },
  });
  if (error) {
    throw new Error(error.message);
  }
  if (!data?.plan) {
    throw new Error(data?.error ?? 'Meal replacement failed.');
  }
  return mapPlan(data.plan);
}

export async function setMealCompleted(
  userId: string,
  plan: MealPlan,
  itemId: string,
  completed: boolean,
): Promise<MealPlan> {
  if (shouldUseLocal(userId)) {
    const next = {
      ...plan,
      days: plan.days.map(day => ({
        ...day,
        items: day.items.map(item =>
          item.id === itemId ? { ...item, completionStatus: completed } : item,
        ),
      })),
    };
    await updateLocalState(state => ({ ...state, plan: next }));
    return next;
  }
  const client = requireClient();
  const { error } = await client
    .from('meal_plan_items')
    .update({ completion_status: completed, updated_at: new Date().toISOString() })
    .eq('id', itemId);
  if (error) {
    throw new Error(error.message);
  }
  return plan;
}

export async function addFoodLog(
  userId: string,
  log: Omit<FoodLog, 'id'>,
): Promise<FoodLog> {
  if (shouldUseLocal(userId)) {
    const entry: FoodLog = { ...log, id: `log-${Date.now()}` };
    await updateLocalState(state => ({ ...state, foodLogs: [entry, ...state.foodLogs] }));
    return entry;
  }
  const client = requireClient();
  const { data, error } = await client
    .from('food_logs')
    .insert({
      user_id: userId,
      food_item_id: log.foodItemId,
      food_name: log.foodName,
      consumed_at: log.consumedAt,
      meal_type: log.mealType,
      quantity_grams: log.quantityGrams,
      calories_snapshot: log.calories,
      protein_snapshot: log.protein,
      carbs_snapshot: log.carbs,
      fat_snapshot: log.fat,
    })
    .select()
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? 'Could not save food log.');
  }
  return { ...log, id: data.id };
}

export async function updateFoodLog(userId: string, log: FoodLog): Promise<FoodLog> {
  if (shouldUseLocal(userId)) {
    await updateLocalState(state => ({
      ...state,
      foodLogs: state.foodLogs.map(entry => (entry.id === log.id ? log : entry)),
    }));
    return log;
  }
  const client = requireClient();
  const { data, error } = await client
    .from('food_logs')
    .update({
      food_item_id: log.foodItemId,
      food_name: log.foodName,
      consumed_at: log.consumedAt,
      meal_type: log.mealType,
      quantity_grams: log.quantityGrams,
      calories_snapshot: log.calories,
      protein_snapshot: log.protein,
      carbs_snapshot: log.carbs,
      fat_snapshot: log.fat,
    })
    .eq('id', log.id)
    .eq('user_id', userId)
    .select()
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? 'Could not update food log.');
  }
  return log;
}

export async function deleteFoodLog(userId: string, id: string): Promise<void> {
  if (shouldUseLocal(userId)) {
    await updateLocalState(state => ({
      ...state,
      foodLogs: state.foodLogs.filter(log => log.id !== id),
    }));
    return;
  }
  const client = requireClient();
  const { error } = await client.from('food_logs').delete().eq('id', id).eq('user_id', userId);
  if (error) {
    throw new Error(error.message);
  }
}

export async function addWater(userId: string, quantityMl: number): Promise<WaterLog> {
  const entry: WaterLog = {
    id: `water-${Date.now()}`,
    quantityMl,
    consumedAt: new Date().toISOString(),
  };
  if (shouldUseLocal(userId)) {
    await updateLocalState(state => ({ ...state, waterLogs: [entry, ...state.waterLogs] }));
    return entry;
  }
  const client = requireClient();
  const { data, error } = await client
    .from('water_logs')
    .insert({ user_id: userId, quantity_ml: quantityMl, consumed_at: entry.consumedAt })
    .select()
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? 'Could not save water log.');
  }
  return { ...entry, id: data.id };
}

export async function removeLastWater(userId: string): Promise<void> {
  if (shouldUseLocal(userId)) {
    await updateLocalState(state => ({
      ...state,
      waterLogs: state.waterLogs.slice(1),
    }));
    return;
  }
  const client = requireClient();
  const { data } = await client
    .from('water_logs')
    .select('id')
    .eq('user_id', userId)
    .order('consumed_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (data?.id) {
    await client.from('water_logs').delete().eq('id', data.id);
  }
}

export async function addWeight(
  userId: string,
  weightKg: number,
  notes?: string,
): Promise<WeightLog> {
  const entry: WeightLog = {
    id: `weight-${Date.now()}`,
    weightKg,
    measuredAt: new Date().toISOString(),
    notes: notes ?? null,
  };
  if (shouldUseLocal(userId)) {
    await updateLocalState(state => ({
      ...state,
      weightLogs: [...state.weightLogs, entry],
      profile: state.profile ? { ...state.profile, weightKg } : state.profile,
    }));
    return entry;
  }
  const client = requireClient();
  const { data, error } = await client
    .from('weight_logs')
    .insert({
      user_id: userId,
      weight_value: weightKg,
      weight_unit: 'kg',
      measured_at: entry.measuredAt,
      notes: notes ?? null,
    })
    .select()
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? 'Could not save weight.');
  }
  await saveProfile(userId, {
    ...(await fetchProfile(userId))!,
    weightKg,
  });
  return { ...entry, id: data.id };
}

export async function toggleFavorite(
  userId: string,
  params: { foodItemId?: string; mealPlanItemId?: string; name: string; calories?: number },
): Promise<void> {
  if (shouldUseLocal(userId)) {
    await updateLocalState(state => {
      const existing = state.favorites.find(
        f =>
          (params.foodItemId && f.foodItemId === params.foodItemId) ||
          (params.mealPlanItemId && f.mealPlanItemId === params.mealPlanItemId),
      );
      return {
        ...state,
        favorites: existing
          ? state.favorites.filter(f => f.id !== existing.id)
          : [
              {
                id: `fav-${Date.now()}`,
                ...params,
                createdAt: new Date().toISOString(),
              },
              ...state.favorites,
            ],
      };
    });
    return;
  }
  const client = requireClient();
  const query = client.from('user_favorites').select('id').eq('user_id', userId);
  const { data: existing } = params.foodItemId
    ? await query.eq('food_item_id', params.foodItemId).maybeSingle()
    : await query.eq('meal_plan_item_id', params.mealPlanItemId ?? '').maybeSingle();
  if (existing?.id) {
    await client.from('user_favorites').delete().eq('id', existing.id);
    return;
  }
  const { error } = await client.from('user_favorites').insert({
    user_id: userId,
    food_item_id: params.foodItemId ?? null,
    meal_plan_item_id: params.mealPlanItemId ?? null,
    name: params.name,
    calories: params.calories ?? null,
  });
  if (error) {
    throw new Error(error.message);
  }
}

export async function generateGroceryList(
  userId: string,
  plan: MealPlan,
  foods: FoodItem[],
): Promise<GroceryList> {
  const list = buildGroceryList(plan, foods, plan.currencyCode);
  if (shouldUseLocal(userId)) {
    await updateLocalState(state => ({ ...state, groceryList: list }));
    return list;
  }
  const client = requireClient();
  await client.from('grocery_lists').delete().eq('user_id', userId).eq('meal_plan_id', plan.id);
  const { data: inserted, error } = await client
    .from('grocery_lists')
    .insert({
      user_id: userId,
      meal_plan_id: plan.id,
      title: list.title,
      status: 'open',
    })
    .select()
    .single();
  if (error || !inserted) {
    throw new Error(error?.message ?? 'Could not create grocery list.');
  }
  const items = list.items.map(item => ({
    grocery_list_id: inserted.id,
    food_item_id: item.foodItemId,
    name: item.name,
    quantity: item.quantityGrams,
    unit: item.unit,
    estimated_cost: item.estimatedCost,
    purchased: false,
    price_stale: item.priceStale,
  }));
  const { error: itemsError } = await client.from('grocery_list_items').insert(items);
  if (itemsError) {
    throw new Error(itemsError.message);
  }
  return { ...list, id: inserted.id };
}

export async function setGroceryItemPurchased(
  userId: string,
  list: GroceryList,
  itemId: string,
  purchased: boolean,
): Promise<GroceryList> {
  const next = {
    ...list,
    items: list.items.map(item => (item.id === itemId ? { ...item, purchased } : item)),
  };
  if (shouldUseLocal(userId)) {
    await updateLocalState(state => ({ ...state, groceryList: next }));
    return next;
  }
  const client = requireClient();
  const { error } = await client
    .from('grocery_list_items')
    .update({ purchased, updated_at: new Date().toISOString() })
    .eq('id', itemId);
  if (error) {
    throw new Error(error.message);
  }
  return next;
}

export async function updateSettingsSnapshot(
  userId: string,
  snapshot: AppStateSnapshot,
): Promise<void> {
  if (!shouldUseLocal(userId)) {
    return;
  }
  const state = await loadLocalState();
  await saveLocalState({ ...emptyLocalState, ...state, ...snapshot });
}

export type { LocalState, BudgetPeriod, MealType };
