export type Language = 'en' | 'ur' | 'roman-ur';
export type ThemeMode = 'light' | 'dark' | 'system';
export type UnitSystem = 'metric' | 'imperial';
export type CountryCode = 'PK' | 'IN';
export type CurrencyCode = 'PKR' | 'INR';
export type Sex = 'male' | 'female' | 'other';
export type GoalType = 'loss' | 'gain' | 'maintain';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type DietType = 'vegetarian' | 'non_vegetarian' | 'eggetarian' | 'vegan';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type BudgetPeriod = 'daily' | 'monthly';

export interface Profile {
  id: string;
  fullName: string;
  dateOfBirth: string;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  countryCode: CountryCode;
  city: string;
  language: Language;
  units: UnitSystem;
  createdAt: string;
  updatedAt: string;
}

export interface UserGoal {
  goalType: GoalType;
  targetWeightKg: number;
  activityLevel: ActivityLevel;
  targetDate?: string | null;
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
  budgetPeriod: BudgetPeriod;
  amount: number;
  currencyCode: CurrencyCode;
  countryCode: CountryCode;
  city: string;
}

export interface FoodItem {
  id: string;
  canonicalName: string;
  nameEn: string;
  nameUr?: string | null;
  nameRomanUr?: string | null;
  nameHi?: string | null;
  category: string;
  dietaryTags: DietType[] | string[];
  allergenTags: string[];
  mealTypes: MealType[];
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g?: number | null;
  servingName: string;
  servingGrams: number;
  pricePerKg: number;
  currencyCode: CurrencyCode;
  priceSource: string;
  priceObservedAt: string;
  priceValidUntil?: string | null;
  sourceName: string;
  verified: boolean;
  instructions?: string;
}

export interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealPlanItem {
  id: string;
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

export interface MealPlanDay {
  id: string;
  planDate: string;
  targetCalories: number;
  estimatedCost: number;
  currencyCode: CurrencyCode;
  items: MealPlanItem[];
}

export interface MealPlan {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  goalSnapshot: UserGoal;
  budgetSnapshot: UserBudget;
  currencyCode: CurrencyCode;
  status: 'active' | 'archived';
  days: MealPlanDay[];
  createdAt: string;
}

export interface FoodLog {
  id: string;
  foodItemId: string;
  foodName: string;
  consumedAt: string;
  mealType: MealType;
  quantityGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface WeightLog {
  id: string;
  weightKg: number;
  measuredAt: string;
  notes?: string | null;
}

export interface WaterLog {
  id: string;
  quantityMl: number;
  consumedAt: string;
}

export interface Favorite {
  id: string;
  foodItemId?: string | null;
  mealPlanItemId?: string | null;
  name: string;
  calories?: number;
  createdAt: string;
}

export interface GroceryItem {
  id: string;
  foodItemId: string;
  name: string;
  quantityGrams: number;
  unit: string;
  estimatedCost: number;
  purchased: boolean;
  priceStale: boolean;
}

export interface GroceryList {
  id: string;
  mealPlanId: string;
  title: string;
  status: 'open' | 'completed';
  items: GroceryItem[];
  createdAt: string;
}

export interface DailyTargets extends NutritionTotals {
  waterMl: number;
}

export interface PlanGenerationInput {
  profile: Profile;
  goal: UserGoal;
  preferences: UserPreferences;
  budget: UserBudget;
  targets: DailyTargets;
  foods: FoodItem[];
  startDate?: string;
}

export interface ReplacementRequest {
  planItem: MealPlanItem;
  reason: 'cheaper' | 'higher_protein' | 'vegetarian' | 'quick' | 'disliked' | 'unavailable';
  foods: FoodItem[];
  currencyCode: CurrencyCode;
}

export interface AuthUser {
  id: string;
  email: string | null;
  fullName?: string | null;
}

export interface SessionInfo {
  user: AuthUser;
  accessToken: string;
}

export interface AppSettings {
  language: Language;
  themeMode: ThemeMode;
  units: UnitSystem;
  honestMode: boolean;
}

export interface AppStateSnapshot {
  profile: Profile | null;
  goal: UserGoal | null;
  preferences: UserPreferences | null;
  budget: UserBudget | null;
  plan: MealPlan | null;
  foodLogs: FoodLog[];
  weightLogs: WeightLog[];
  waterLogs: WaterLog[];
  favorites: Favorite[];
  groceryList: GroceryList | null;
}
