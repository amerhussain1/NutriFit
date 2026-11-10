export type CountryCode = 'PK' | 'IN';
export type CurrencyCode = 'PKR' | 'INR';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type DietType = 'vegetarian' | 'non_vegetarian' | 'eggetarian' | 'vegan';
export type GoalType = 'loss' | 'gain' | 'maintain';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Sex = 'male' | 'female' | 'other';
export type ReplacementReason =
  | 'cheaper'
  | 'higher_protein'
  | 'vegetarian'
  | 'quick'
  | 'disliked'
  | 'unavailable';

export interface Profile {
  id: string;
  fullName: string;
  dateOfBirth: string;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  countryCode: CountryCode;
  city: string;
  language: string;
}

export interface UserGoal {
  goalType: GoalType;
  targetWeightKg: number;
  activityLevel: ActivityLevel;
  targetDate: string | null;
}

export interface UserPreferences {
  dietType: DietType;
  allergies: string[];
  excludedIngredients: string[];
  dislikedFoods: string[];
  preferredFoods: string[];
  cookingConstraints: string[];
  mealSchedule: string[];
}

export interface UserBudget {
  budgetPeriod: 'daily' | 'monthly';
  amount: number;
  currencyCode: CurrencyCode;
  countryCode: CountryCode;
  city: string;
}

export interface FoodItem {
  id: string;
  canonicalName: string;
  nameEn: string;
  nameUr: string | null;
  nameRomanUr: string | null;
  nameHi: string | null;
  category: string;
  dietaryTags: string[];
  allergenTags: string[];
  mealTypes: MealType[];
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number | null;
  servingName: string;
  servingGrams: number;
  pricePerKg: number;
  currencyCode: CurrencyCode;
  priceSource: string;
  priceObservedAt: string;
  priceValidUntil: string | null;
  sourceName: string;
  verified: boolean;
  instructions: string;
}

export interface DailyTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  waterMl: number;
}

export interface PlanItemDraft {
  foodItemId: string;
  foodName: string;
  mealType: MealType;
  quantityGrams: number;
  servingDescription: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  estimatedCost: number;
  preparationInstructions: string;
  completionStatus: boolean;
}

export interface PlanDayDraft {
  planDate: string;
  targetCalories: number;
  estimatedCost: number;
  currencyCode: CurrencyCode;
  items: PlanItemDraft[];
}

export interface PlanDraft {
  title: string;
  startDate: string;
  endDate: string;
  goalSnapshot: Record<string, unknown>;
  budgetSnapshot: Record<string, unknown>;
  currencyCode: CurrencyCode;
  days: PlanDayDraft[];
  generationMetadata: Record<string, unknown>;
}

export interface AiSelection {
  day_index: number;
  meals: {
    meal_type: MealType;
    items: { food_id: string; grams: number; reason?: string }[];
  }[];
}
