import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { HttpError } from './http.ts';
import { calculateDailyTargets, safeCalorieTarget } from './nutrition.ts';
import type {
  ActivityLevel,
  CountryCode,
  DailyTargets,
  DietType,
  GoalType,
  Profile,
  Sex,
  UserBudget,
  UserGoal,
  UserPreferences,
} from './types.ts';

export interface UserContext {
  userId: string;
  profile: Profile;
  goal: UserGoal;
  preferences: UserPreferences;
  budget: UserBudget;
  targets: DailyTargets;
  calorieNotes: string[];
}

function textArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function num(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function loadUserContext(
  client: SupabaseClient,
  userId: string,
): Promise<UserContext> {
  const [profileRes, goalRes, prefsRes, budgetRes] = await Promise.all([
    client.from('profiles').select('*').eq('id', userId).maybeSingle(),
    client.from('user_goals').select('*').eq('user_id', userId).maybeSingle(),
    client.from('user_preferences').select('*').eq('user_id', userId).maybeSingle(),
    client.from('user_budgets').select('*').eq('user_id', userId).maybeSingle(),
  ]);

  if (profileRes.error) {
    throw new HttpError(500, profileRes.error.message, 'profile_error');
  }
  if (!profileRes.data) {
    throw new HttpError(400, 'Complete onboarding before generating a plan.', 'profile_missing');
  }

  const p = profileRes.data;
  const countryCode = (p.country_code === 'IN' ? 'IN' : 'PK') as CountryCode;
  const profile: Profile = {
    id: userId,
    fullName: String(p.full_name ?? ''),
    dateOfBirth: String(p.date_of_birth ?? '1995-01-01'),
    sex: (p.sex ?? 'other') as Sex,
    heightCm: num(p.height_value, 170),
    weightKg: num(p.current_weight_value, 70),
    countryCode,
    city: String(p.city ?? (countryCode === 'PK' ? 'Karachi' : 'Delhi')),
    language: String(p.preferred_language ?? 'en'),
  };

  const goalRow = goalRes.data;
  const goal: UserGoal = {
    goalType: ((goalRow?.goal_type ?? 'maintain') as GoalType) ?? 'maintain',
    targetWeightKg: num(goalRow?.target_weight, profile.weightKg),
    activityLevel: ((goalRow?.activity_level ?? 'moderate') as ActivityLevel) ?? 'moderate',
    targetDate: goalRow?.target_date == null ? null : String(goalRow.target_date),
  };

  const prefRow = prefsRes.data;
  const preferences: UserPreferences = {
    dietType: ((prefRow?.diet_type ?? 'non_vegetarian') as DietType) ?? 'non_vegetarian',
    allergies: textArray(prefRow?.allergies),
    excludedIngredients: textArray(prefRow?.excluded_ingredients),
    dislikedFoods: textArray(prefRow?.disliked_foods),
    preferredFoods: textArray(prefRow?.preferred_foods),
    cookingConstraints: textArray(prefRow?.cooking_constraints),
    mealSchedule: textArray(prefRow?.meal_schedule),
  };

  const budgetRow = budgetRes.data;
  const budget: UserBudget = {
    budgetPeriod: budgetRow?.budget_period === 'monthly' ? 'monthly' : 'daily',
    amount: num(budgetRow?.amount, 0),
    currencyCode: budgetRow?.currency_code === 'INR' ? 'INR' : countryCode === 'IN' ? 'INR' : 'PKR',
    countryCode: (budgetRow?.country_code === 'IN' ? 'IN' : countryCode) as CountryCode,
    city: String(budgetRow?.city ?? profile.city),
  };

  const calorie = safeCalorieTarget({ profile, goal });
  const targets = calculateDailyTargets(profile, goal);

  return {
    userId,
    profile,
    goal,
    preferences,
    budget,
    targets,
    calorieNotes: calorie.notes,
  };
}
