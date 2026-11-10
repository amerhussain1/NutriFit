import type {
  ActivityLevel,
  CurrencyCode,
  DietType,
  GoalType,
  Language,
  MealType,
  Sex,
} from '../types';

export const CITIES: Record<'PK' | 'IN', string[]> = {
  PK: ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta'],
  IN: ['Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad'],
};

export const CURRENCY_BY_COUNTRY: Record<'PK' | 'IN', CurrencyCode> = {
  PK: 'PKR',
  IN: 'INR',
};

export const GOAL_OPTIONS: { value: GoalType; labelKey: string; icon: string }[] = [
  { value: 'loss', labelKey: 'goal.loss', icon: 'trending-down' },
  { value: 'gain', labelKey: 'goal.gain', icon: 'trending-up' },
  { value: 'maintain', labelKey: 'goal.maintain', icon: 'swap-horizontal' },
];

export const ACTIVITY_OPTIONS: {
  value: ActivityLevel;
  labelKey: string;
  multiplier: number;
}[] = [
  { value: 'sedentary', labelKey: 'activity.sedentary', multiplier: 1.2 },
  { value: 'light', labelKey: 'activity.light', multiplier: 1.375 },
  { value: 'moderate', labelKey: 'activity.moderate', multiplier: 1.55 },
  { value: 'active', labelKey: 'activity.active', multiplier: 1.725 },
  { value: 'very_active', labelKey: 'activity.veryActive', multiplier: 1.9 },
];

export const DIET_OPTIONS: { value: DietType; labelKey: string }[] = [
  { value: 'non_vegetarian', labelKey: 'diet.nonVegetarian' },
  { value: 'vegetarian', labelKey: 'diet.vegetarian' },
  { value: 'eggetarian', labelKey: 'diet.eggetarian' },
  { value: 'vegan', labelKey: 'diet.vegan' },
];

export const SEX_OPTIONS: { value: Sex; labelKey: string }[] = [
  { value: 'male', labelKey: 'sex.male' },
  { value: 'female', labelKey: 'sex.female' },
  { value: 'other', labelKey: 'sex.other' },
];

export const ALLERGY_OPTIONS = [
  'gluten',
  'dairy',
  'egg',
  'peanut',
  'tree_nut',
  'soy',
  'fish',
  'shellfish',
  'sesame',
];

export const COOKING_CONSTRAINTS = [
  'no_cooking',
  'quick_meals',
  'one_pot',
  'no_oven',
  'limited_utensils',
];

export const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'ur', label: 'اردو' },
  { value: 'roman-ur', label: 'Roman Urdu' },
];

export const WATER_GOAL_ML = 2500;
