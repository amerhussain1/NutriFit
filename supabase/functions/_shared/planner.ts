import { dailyBudgetAmount, clamp, foodCost, isPriceStale, nutritionForQuantity, round1 } from './nutrition.ts';
import type {
  AiSelection,
  DailyTargets,
  FoodItem,
  MealType,
  PlanDayDraft,
  PlanDraft,
  PlanItemDraft,
  ReplacementReason,
  UserBudget,
  UserGoal,
  UserPreferences,
} from './types.ts';

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_RATIOS: Record<MealType, number> = {
  breakfast: 0.25,
  lunch: 0.32,
  dinner: 0.31,
  snack: 0.12,
};

function normalise(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchesText(food: FoodItem, token: string): boolean {
  const needle = normalise(token);
  if (!needle) {
    return false;
  }
  return [food.nameEn, food.nameUr ?? '', food.nameRomanUr ?? '', food.nameHi ?? '', food.canonicalName]
    .map(normalise)
    .some(name => name.includes(needle));
}

export function dietAllows(food: FoodItem, preferences: UserPreferences): boolean {
  const tags = food.dietaryTags.map(tag => tag.toLowerCase());
  switch (preferences.dietType) {
    case 'vegan':
      return tags.includes('vegan');
    case 'vegetarian':
      return tags.includes('vegetarian') || tags.includes('vegan');
    case 'eggetarian':
      return tags.includes('vegetarian') || tags.includes('vegan') || tags.includes('eggetarian');
    case 'non_vegetarian':
    default:
      return true;
  }
}

export function isFoodAllowed(food: FoodItem, preferences: UserPreferences): boolean {
  if (!dietAllows(food, preferences)) {
    return false;
  }
  const allergies = preferences.allergies.map(value => value.toLowerCase());
  if (food.allergenTags.some(tag => allergies.includes(tag.toLowerCase()))) {
    return false;
  }
  if (preferences.excludedIngredients.some(item => matchesText(food, item))) {
    return false;
  }
  if (preferences.dislikedFoods.some(item => matchesText(food, item))) {
    return false;
  }
  return true;
}

export function eligibleFoods(foods: FoodItem[], preferences: UserPreferences): FoodItem[] {
  return foods.filter(food => isFoodAllowed(food, preferences));
}

function roundGrams(value: number, min = 20, max = 700): number {
  return clamp(Math.round(value / 5) * 5, min, max);
}

export function buildPlanItem(food: FoodItem, grams: number, mealType: MealType): PlanItemDraft {
  const safeGrams = roundGrams(grams);
  const nutrition = nutritionForQuantity(food, safeGrams);
  return {
    foodItemId: food.id,
    foodName: food.nameEn,
    mealType,
    quantityGrams: safeGrams,
    servingDescription: `${safeGrams}g`,
    calories: nutrition.calories,
    protein: nutrition.protein,
    carbs: nutrition.carbs,
    fat: nutrition.fat,
    estimatedCost: foodCost(food, safeGrams),
    preparationInstructions:
      food.instructions || `Prepare ${food.nameEn} using minimal oil and salt. Portion is measured after cooking.`,
    completionStatus: false,
  };
}

function pickFood(candidates: FoodItem[], seed: number, preferred: string[]): FoodItem | undefined {
  if (candidates.length === 0) {
    return undefined;
  }
  const preferredMatches = candidates.filter(food =>
    preferred.some(item => matchesText(food, item)),
  );
  const pool = preferredMatches.length > 0 ? preferredMatches : candidates;
  return pool[Math.abs(seed) % pool.length];
}

function deterministicMeal(
  foods: FoodItem[],
  byMeal: Map<MealType, FoodItem[]>,
  mealType: MealType,
  dayIndex: number,
  mealIndex: number,
  targets: DailyTargets,
  preferred: string[],
): PlanItemDraft[] {
  const candidates = byMeal.get(mealType) ?? foods;
  const seed = dayIndex * 7 + mealIndex;
  const primary = pickFood(candidates, seed, preferred);
  if (!primary) {
    return [];
  }

  const targetCalories = targets.calories * MEAL_RATIOS[mealType];
  const per100 = Math.max(1, primary.caloriesPer100g);
  const primaryGrams = clamp((targetCalories * 0.75 * 100) / per100, 40, 500);
  const items = [buildPlanItem(primary, primaryGrams, mealType)];

  const sideCategories =
    mealType === 'breakfast'
      ? ['Fruit', 'Dairy', 'Beverage']
      : mealType === 'snack'
        ? ['Fruit', 'Snack', 'Dairy']
        : ['Vegetable', 'Dairy'];
  const sides = foods.filter(
    food => food.id !== primary.id && sideCategories.includes(food.category),
  );
  const sidePool = sides.length > 0 ? sides : foods.filter(food => food.id !== primary.id);
  const side = pickFood(sidePool, seed + 3, preferred);
  if (side) {
    items.push(buildPlanItem(side, clamp(side.servingGrams, 20, 300), mealType));
  }
  return items;
}

function buildByMeal(foods: FoodItem[]): Map<MealType, FoodItem[]> {
  const byMeal = new Map<MealType, FoodItem[]>();
  MEAL_ORDER.forEach(type => {
    const exact = foods.filter(food => food.mealTypes.includes(type));
    const fallback = foods.filter(food => food.category === 'Fruit' || food.category === 'Vegetable');
    byMeal.set(type, exact.length > 0 ? exact : fallback.length > 0 ? fallback : foods);
  });
  return byMeal;
}

function deterministicDay(params: {
  foods: FoodItem[];
  byMeal: Map<MealType, FoodItem[]>;
  dayIndex: number;
  targets: DailyTargets;
  preferred: string[];
  planDate: string;
  currencyCode: PlanDraft['currencyCode'];
}): PlanDayDraft {
  const { foods, byMeal, dayIndex, targets, preferred, planDate, currencyCode } = params;
  const items = MEAL_ORDER.flatMap((mealType, mealIndex) =>
    deterministicMeal(foods, byMeal, mealType, dayIndex, mealIndex, targets, preferred),
  );
  return {
    planDate,
    targetCalories: targets.calories,
    estimatedCost: round1(items.reduce((sum, item) => sum + item.estimatedCost, 0)),
    currencyCode,
    items,
  };
}

function scaleDayToBudget(items: PlanItemDraft[], dailyBudget: number): PlanItemDraft[] {
  const current = items.reduce((sum, item) => sum + item.estimatedCost, 0);
  if (dailyBudget <= 0 || current <= dailyBudget || current <= 0) {
    return items;
  }
  const ratio = Math.max(0.55, dailyBudget / current);
  return items.map(item => {
    const grams = roundGrams(item.quantityGrams * ratio);
    const factor = grams / item.quantityGrams;
    const nutrition = {
      calories: Math.round(item.calories * factor),
      protein: round1(item.protein * factor),
      carbs: round1(item.carbs * factor),
      fat: round1(item.fat * factor),
    };
    return {
      ...item,
      quantityGrams: grams,
      servingDescription: `${grams}g`,
      ...nutrition,
      estimatedCost: round1(item.estimatedCost * factor),
    };
  });
}

function aiDayToDraft(params: {
  selection: AiSelection | undefined;
  aiMeals: Map<MealType, AiSelection['meals'][number]> | undefined;
  foods: FoodItem[];
  byFood: Map<string, FoodItem>;
  byMeal: Map<MealType, FoodItem[]>;
  dayIndex: number;
  targets: DailyTargets;
  preferred: string[];
  planDate: string;
  currencyCode: PlanDraft['currencyCode'];
}): PlanDayDraft {
  const {
    aiMeals,
    foods,
    byFood,
    byMeal,
    dayIndex,
    targets,
    preferred,
    planDate,
    currencyCode,
  } = params;

  const items: PlanItemDraft[] = [];
  MEAL_ORDER.forEach((mealType, mealIndex) => {
    const aiMeal = aiMeals?.get(mealType);
    const seen = new Set<string>();
    const mealItems: PlanItemDraft[] = [];

    if (aiMeal) {
      for (const entry of aiMeal.items ?? []) {
        const food = byFood.get(String(entry.food_id));
        const grams = Number(entry.grams);
        if (!food || !Number.isFinite(grams) || seen.has(food.id)) {
          continue;
        }
        seen.add(food.id);
        mealItems.push(buildPlanItem(food, grams, mealType));
        if (mealItems.length >= 4) {
          break;
        }
      }
    }

    if (mealItems.length === 0) {
      items.push(
        ...deterministicMeal(foods, byMeal, mealType, dayIndex, mealIndex, targets, preferred),
      );
    } else {
      items.push(...mealItems);
    }
  });

  return {
    planDate,
    targetCalories: targets.calories,
    estimatedCost: round1(items.reduce((sum, item) => sum + item.estimatedCost, 0)),
    currencyCode,
    items,
  };
}

function parseAiMeals(
  selection: AiSelection,
): Map<MealType, AiSelection['meals'][number]> | undefined {
  if (!selection || !Array.isArray(selection.meals)) {
    return undefined;
  }
  const map = new Map<MealType, AiSelection['meals'][number]>();
  for (const meal of selection.meals) {
    if (MEAL_ORDER.includes(meal.meal_type)) {
      map.set(meal.meal_type, meal);
    }
  }
  return map.size > 0 ? map : undefined;
}

function dateKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function addDays(value: Date, days: number): Date {
  const next = new Date(value.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export interface GenerateDraftParams {
  profileName: string;
  goal: UserGoal;
  budget: UserBudget;
  targets: DailyTargets;
  preferences: UserPreferences;
  foods: FoodItem[];
  startDate?: string;
  aiSelections?: AiSelection[];
  source: 'gemini' | 'deterministic_fallback';
  sourceDetail?: string;
}

export function generatePlanDraft(params: GenerateDraftParams): {
  draft: PlanDraft;
  warnings: string[];
} {
  const {
    profileName,
    goal,
    budget,
    targets,
    preferences,
    foods,
    startDate,
    aiSelections,
    source,
    sourceDetail,
  } = params;

  const usable = eligibleFoods(foods, preferences);
  if (usable.length === 0) {
    throw new Error(
      'No foods match the current diet, allergy and dislike settings. Loosen a preference to continue.',
    );
  }

  const byMeal = buildByMeal(usable);
  const byFood = new Map(usable.map(food => [food.id, food]));
  const start = startDate && !Number.isNaN(new Date(`${startDate}T00:00:00Z`).getTime())
    ? new Date(`${startDate}T00:00:00Z`)
    : new Date(`${dateKey(new Date())}T00:00:00Z`);

  const aiByDay = new Map<number, AiSelection>();
  for (const selection of aiSelections ?? []) {
    const index = Number(selection?.day_index);
    if (Number.isInteger(index) && index >= 0 && index < 7) {
      aiByDay.set(index, selection);
    }
  }

  const dailyBudget = dailyBudgetAmount(budget);
  const currencyCode = budget.currencyCode;

  const days = Array.from({ length: 7 }).map((_, dayIndex) => {
    const planDate = dateKey(addDays(start, dayIndex));
    const aiSelection = aiByDay.get(dayIndex);
    const aiMeals = aiSelection ? parseAiMeals(aiSelection) : undefined;

    const day = aiMeals
      ? aiDayToDraft({
          selection: aiSelection,
          aiMeals,
          foods: usable,
          byFood,
          byMeal,
          dayIndex,
          targets,
          preferred: preferences.preferredFoods,
          planDate,
          currencyCode,
        })
      : deterministicDay({
          foods: usable,
          byMeal,
          dayIndex,
          targets,
          preferred: preferences.preferredFoods,
          planDate,
          currencyCode,
        });

    if (dailyBudget > 0) {
      const scaledItems = scaleDayToBudget(day.items, dailyBudget);
      const scaledCost = round1(
        scaledItems.reduce((sum, item) => sum + item.estimatedCost, 0),
      );
      return { ...day, items: scaledItems, estimatedCost: scaledCost };
    }
    return day;
  });

  const warnings: string[] = [];
  if (dailyBudget > 0) {
    const overDays = days.filter(day => day.estimatedCost > dailyBudget + 0.5);
    if (overDays.length > 0) {
      warnings.push(
        `The selected budget is very low. ${overDays.length} day(s) may exceed the daily allowance even after portion scaling.`,
      );
    }
  } else {
    warnings.push('No budget was provided, so cost is estimated but not constrained.');
  }

  const usedFoodIds = new Set(days.flatMap(day => day.items.map(item => item.foodItemId)));
  const staleCount = Array.from(usedFoodIds).filter(id => {
    const food = byFood.get(id);
    return food ? isPriceStale(food) : true;
  }).length;
  if (staleCount > 0) {
    warnings.push(
      `${staleCount} ingredient price(s) are missing or stale. Costs are estimates, not live market prices.`,
    );
  }

  const firstName = profileName.split(' ')[0] || 'Your';
  const draft: PlanDraft = {
    title: `${firstName} 7-day plan`,
    startDate: dateKey(start),
    endDate: dateKey(addDays(start, 6)),
    goalSnapshot: {
      goalType: goal.goalType,
      targetWeightKg: goal.targetWeightKg,
      activityLevel: goal.activityLevel,
      targetDate: goal.targetDate,
    },
    budgetSnapshot: {
      budgetPeriod: budget.budgetPeriod,
      amount: budget.amount,
      currencyCode,
      countryCode: budget.countryCode,
      city: budget.city,
    },
    currencyCode,
    days,
    generationMetadata: {
      source,
      sourceDetail: sourceDetail ?? null,
      model: Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash',
      generatedAt: new Date().toISOString(),
      targets,
      warnings,
      disclaimer:
        'Nutrition and cost estimates are for guidance only and are not medical advice.',
    },
  };

  return { draft, warnings };
}

export function replacementCandidates(params: {
  foods: FoodItem[];
  planItem: PlanItemDraft;
  reason: ReplacementReason;
}): FoodItem[] {
  const { foods, planItem, reason } = params;
  const sameMeal = foods.filter(
    food => food.mealTypes.includes(planItem.mealType) && food.id !== planItem.foodItemId,
  );
  const pool = sameMeal.length > 0
    ? sameMeal
    : foods.filter(food => food.id !== planItem.foodItemId);

  const currentProteinPer100 =
    planItem.quantityGrams > 0 ? (planItem.protein / planItem.quantityGrams) * 100 : 0;

  switch (reason) {
    case 'cheaper':
      return pool.filter(food => foodCost(food, planItem.quantityGrams) < planItem.estimatedCost);
    case 'higher_protein':
      return pool.filter(food => food.proteinPer100g > currentProteinPer100);
    case 'vegetarian':
      return pool.filter(food => {
        const tags = food.dietaryTags.map(tag => tag.toLowerCase());
        return tags.includes('vegetarian') || tags.includes('vegan');
      });
    case 'quick':
      return pool.filter(
        food =>
          ['Fruit', 'Snack', 'Beverage', 'Dairy'].includes(food.category) ||
          /salad|dahi|boiled|fresh/i.test(`${food.nameEn} ${food.instructions}`),
      );
    case 'disliked':
    case 'unavailable':
    default:
      return pool;
  }
}

export function buildReplacementItem(params: {
  food: FoodItem;
  planItem: PlanItemDraft;
  reason: ReplacementReason;
}): PlanItemDraft {
  const { food, planItem, reason } = params;
  const currentCalories = Math.max(1, planItem.calories);
  const per100 = Math.max(1, food.caloriesPer100g);
  let grams = clamp((currentCalories / per100) * 100, 30, 600);

  if (reason === 'cheaper') {
    const maxAffordable = Math.max(30, (planItem.estimatedCost / Math.max(1, food.pricePerKg)) * 1000);
    grams = clamp(Math.min(grams, maxAffordable), 30, 600);
  }
  if (reason === 'higher_protein') {
    grams = clamp(grams, 50, 600);
  }

  return buildPlanItem(food, grams, planItem.mealType);
}
