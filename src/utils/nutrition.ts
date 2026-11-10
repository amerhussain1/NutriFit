import { ACTIVITY_OPTIONS, WATER_GOAL_ML } from '../constants/options';
import type {
  ActivityLevel,
  DailyTargets,
  FoodItem,
  GoalType,
  NutritionTotals,
  Profile,
  Sex,
  UserGoal,
} from '../types';

export function calculateAge(dateOfBirth: string, now = new Date()): number {
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) {
    return 0;
  }
  let age = now.getFullYear() - dob.getFullYear();
  const month = now.getMonth() - dob.getMonth();
  if (month < 0 || (month === 0 && now.getDate() < dob.getDate())) {
    age -= 1;
  }
  return Math.max(0, age);
}

export function activityMultiplier(level: ActivityLevel): number {
  return ACTIVITY_OPTIONS.find(o => o.value === level)?.multiplier ?? 1.2;
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

export function calculateTdee(profile: Profile, goal: UserGoal): number {
  const age = calculateAge(profile.dateOfBirth);
  const bmr = bmrMifflinStJeor({
    sex: profile.sex,
    weightKg: profile.weightKg,
    heightCm: profile.heightCm,
    age,
  });
  return Math.round(bmr * activityMultiplier(goal.activityLevel));
}

export function bmi(weightKg: number, heightCm: number): number {
  if (heightCm <= 0) {
    return 0;
  }
  const meters = heightCm / 100;
  return weightKg / (meters * meters);
}

export function bmiCategory(value: number): 'underweight' | 'normal' | 'overweight' | 'obese' {
  if (value < 18.5) {
    return 'underweight';
  }
  if (value < 25) {
    return 'normal';
  }
  if (value < 30) {
    return 'overweight';
  }
  return 'obese';
}

export function idealWeightRange(heightCm: number): { min: number; max: number } {
  const meters = heightCm / 100;
  return {
    min: Math.round(18.5 * meters * meters * 10) / 10,
    max: Math.round(24.9 * meters * meters * 10) / 10,
  };
}

export function safeCalorieTarget(params: {
  profile: Profile;
  goal: UserGoal;
}): { bmr: number; tdee: number; target: number; adjusted: boolean; note?: string } {
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
  const floor = profile.sex === 'male' ? 1500 : 1200;

  if (age > 0 && age < 18) {
    return {
      bmr,
      tdee,
      target: tdee,
      adjusted: true,
      note: 'Under 18: no deficit or surplus applied. Please consult a qualified professional.',
    };
  }

  let target = tdee;
  if (goal.goalType === 'loss') {
    target = Math.round(Math.max(floor, tdee - Math.min(500, tdee * 0.2)));
  } else if (goal.goalType === 'gain') {
    target = Math.round(tdee + 300);
  }

  return {
    bmr,
    tdee,
    target,
    adjusted: target !== tdee,
  };
}

export function macroTargets(params: {
  calories: number;
  weightKg: number;
  goalType: GoalType;
  activityLevel: ActivityLevel;
}): NutritionTotals {
  const { calories, weightKg, goalType, activityLevel } = params;
  const proteinPerKg =
    goalType === 'loss' ? 1.6 : goalType === 'gain' ? 1.8 : activityLevel === 'sedentary' ? 1.2 : 1.4;
  const protein = Math.round(Math.min(weightKg * proteinPerKg, weightKg * 2.2));
  const fat = Math.round((calories * 0.25) / 9);
  const carbs = Math.round(Math.max(0, (calories - protein * 4 - fat * 9) / 4));
  return { calories: Math.round(calories), protein, carbs, fat };
}

export function calculateDailyTargets(profile: Profile, goal: UserGoal): DailyTargets {
  const result = safeCalorieTarget({ profile, goal });
  const macros = macroTargets({
    calories: result.target,
    weightKg: profile.weightKg,
    goalType: goal.goalType,
    activityLevel: goal.activityLevel,
  });
  const water = Math.round(
    Math.min(4000, Math.max(1500, profile.weightKg * 35)),
  );
  return { ...macros, waterMl: water || WATER_GOAL_ML };
}

export function nutritionForQuantity(food: FoodItem, grams: number): NutritionTotals {
  const factor = grams / 100;
  return {
    calories: Math.round(food.caloriesPer100g * factor),
    protein: Math.round(food.proteinPer100g * factor * 10) / 10,
    carbs: Math.round(food.carbsPer100g * factor * 10) / 10,
    fat: Math.round(food.fatPer100g * factor * 10) / 10,
  };
}

export function scaleNutrition(
  totals: NutritionTotals,
  fromGrams: number,
  toGrams: number,
): NutritionTotals {
  if (fromGrams <= 0 || toGrams <= 0) {
    return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  }
  const factor = toGrams / fromGrams;
  return {
    calories: Math.round(totals.calories * factor),
    protein: Math.round(totals.protein * factor * 10) / 10,
    carbs: Math.round(totals.carbs * factor * 10) / 10,
    fat: Math.round(totals.fat * factor * 10) / 10,
  };
}

export function sumNutrition(items: NutritionTotals[]): NutritionTotals {
  return items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: Math.round((acc.protein + item.protein) * 10) / 10,
      carbs: Math.round((acc.carbs + item.carbs) * 10) / 10,
      fat: Math.round((acc.fat + item.fat) * 10) / 10,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}
