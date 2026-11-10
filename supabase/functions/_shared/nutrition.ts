import type {
  ActivityLevel,
  DailyTargets,
  FoodItem,
  GoalType,
  Profile,
  Sex,
  UserBudget,
  UserGoal,
} from './types.ts';

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const STALE_PRICE_DAYS = 45;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function calculateAge(dateOfBirth: string, now = new Date()): number {
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) {
    return 0;
  }
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const month = now.getUTCMonth() - dob.getUTCMonth();
  if (month < 0 || (month === 0 && now.getUTCDate() < dob.getUTCDate())) {
    age -= 1;
  }
  return Math.max(0, age);
}

export function activityMultiplier(level: ActivityLevel): number {
  return ACTIVITY_MULTIPLIERS[level] ?? 1.55;
}

export function bmrMifflinStJeor(params: {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  age: number;
}): number {
  const { sex, weightKg, heightCm, age } = params;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (sex === 'male') {
    return base + 5;
  }
  if (sex === 'female') {
    return base - 161;
  }
  return base - 78;
}

export function safeCalorieTarget(params: {
  profile: Profile;
  goal: UserGoal;
}): { bmr: number; tdee: number; target: number; adjusted: boolean; notes: string[] } {
  const { profile, goal } = params;
  const age = calculateAge(profile.dateOfBirth);
  const bmr = Math.round(
    bmrMifflinStJeor({
      sex: profile.sex,
      weightKg: profile.weightKg,
      heightCm: profile.heightCm,
      age,
    }),
  );
  const tdee = Math.round(bmr * activityMultiplier(goal.activityLevel));
  const notes: string[] = [];
  const floor = profile.sex === 'male' ? 1500 : 1200;

  if (age > 0 && age < 18) {
    notes.push('Under 18: no calorie deficit or surplus was applied. Consult a qualified professional.');
    return { bmr, tdee, target: tdee, adjusted: true, notes };
  }

  let target = tdee;
  if (goal.goalType === 'loss') {
    target = Math.round(Math.max(floor, tdee - Math.min(500, tdee * 0.2)));
  } else if (goal.goalType === 'gain') {
    target = Math.round(tdee + 300);
  }

  if (target !== tdee) {
    notes.push('Calorie target is an estimate and not medical advice.');
  }
  return { bmr, tdee, target, adjusted: target !== tdee, notes };
}

export function macroTargets(params: {
  calories: number;
  weightKg: number;
  goalType: GoalType;
  activityLevel: ActivityLevel;
}): { calories: number; protein: number; carbs: number; fat: number } {
  const { calories, weightKg, goalType, activityLevel } = params;
  const proteinPerKg =
    goalType === 'loss'
      ? 1.6
      : goalType === 'gain'
        ? 1.8
        : activityLevel === 'sedentary'
          ? 1.2
          : 1.4;
  const protein = Math.round(Math.min(weightKg * proteinPerKg, weightKg * 2.2));
  const fat = Math.round((calories * 0.25) / 9);
  const carbs = Math.round(Math.max(0, (calories - protein * 4 - fat * 9) / 4));
  return { calories: Math.round(calories), protein, carbs, fat };
}

export function calculateDailyTargets(profile: Profile, goal: UserGoal): DailyTargets {
  const calorie = safeCalorieTarget({ profile, goal });
  const macros = macroTargets({
    calories: calorie.target,
    weightKg: profile.weightKg,
    goalType: goal.goalType,
    activityLevel: goal.activityLevel,
  });
  const waterMl = Math.round(Math.min(4000, Math.max(1500, profile.weightKg * 35)));
  return { ...macros, waterMl };
}

export function nutritionForQuantity(food: FoodItem, grams: number) {
  const factor = grams / 100;
  return {
    calories: Math.round(food.caloriesPer100g * factor),
    protein: round1(food.proteinPer100g * factor),
    carbs: round1(food.carbsPer100g * factor),
    fat: round1(food.fatPer100g * factor),
  };
}

export function foodCost(food: FoodItem, grams: number): number {
  return round1((grams / 1000) * food.pricePerKg);
}

export function dailyBudgetAmount(budget: UserBudget, daysInMonth = 30): number {
  const amount = Math.max(0, budget.amount);
  return budget.budgetPeriod === 'monthly' ? amount / daysInMonth : amount;
}

export function isPriceStale(food: FoodItem, now = new Date()): boolean {
  if (food.pricePerKg <= 0) {
    return true;
  }
  if (!food.priceValidUntil) {
    const observed = new Date(food.priceObservedAt);
    const ageDays = (now.getTime() - observed.getTime()) / 86400000;
    return ageDays > STALE_PRICE_DAYS;
  }
  return new Date(food.priceValidUntil).getTime() < now.getTime();
}
