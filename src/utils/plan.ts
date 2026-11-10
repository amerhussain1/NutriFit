import { getSeedFoods } from '../constants/foodSeed';
import type {
  CurrencyCode,
  DailyTargets,
  FoodItem,
  GroceryItem,
  GroceryList,
  MealPlan,
  MealPlanDay,
  MealPlanItem,
  MealType,
  PlanGenerationInput,
  ReplacementRequest,
  UserPreferences,
} from '../types';
import { addDays, clamp, toDateKey } from './format';
import { foodCost, isPriceStale } from './budget';
import { nutritionForQuantity } from './nutrition';

const MEAL_RATIOS: Record<MealType, number> = {
  breakfast: 0.25,
  lunch: 0.32,
  dinner: 0.31,
  snack: 0.12,
};

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

let idCounter = 0;
function createId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}

function normalise(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF ]/g, ' ').replace(/\s+/g, ' ').trim();
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
  const tags = (food.dietaryTags as string[]).map(t => t.toLowerCase());
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
  const allergies = preferences.allergies.map(a => a.toLowerCase());
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

function pickFood(
  candidates: FoodItem[],
  seed: number,
  preferred: string[],
): FoodItem | undefined {
  if (candidates.length === 0) {
    return undefined;
  }
  const preferredMatches = candidates.filter(food =>
    preferred.some(item => matchesText(food, item)),
  );
  const pool = preferredMatches.length > 0 ? preferredMatches : candidates;
  return pool[Math.abs(seed) % pool.length];
}

function instructionsFor(food: FoodItem): string {
  if (food.instructions) {
    return food.instructions;
  }
  return `Prepare ${food.nameEn} using minimal oil and salt. Portion is measured after cooking.`;
}

export function buildPlanItem(
  food: FoodItem,
  grams: number,
  mealType: MealType,
): MealPlanItem {
  const safeGrams = clamp(Math.round(grams / 5) * 5, 20, 700);
  const nutrition = nutritionForQuantity(food, safeGrams);
  return {
    id: createId('item'),
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
    preparationInstructions: instructionsFor(food),
    completionStatus: false,
  };
}

function chooseSide(
  candidates: FoodItem[],
  primary: FoodItem,
  mealType: MealType,
  seed: number,
  preferred: string[],
): FoodItem | undefined {
  const sideCategories =
    mealType === 'breakfast'
      ? ['Fruit', 'Dairy', 'Beverage']
      : mealType === 'snack'
        ? ['Fruit', 'Snack', 'Dairy']
        : ['Vegetable', 'Dairy'];
  const sides = candidates.filter(
    food => food.id !== primary.id && sideCategories.includes(food.category),
  );
  return pickFood(sides.length > 0 ? sides : candidates.filter(f => f.id !== primary.id), seed + 3, preferred);
}

function scaleDayItems(items: MealPlanItem[], targetCost: number): MealPlanItem[] {
  const current = items.reduce((sum, item) => sum + item.estimatedCost, 0);
  if (current <= targetCost || current <= 0) {
    return items;
  }
  const ratio = Math.max(0.55, targetCost / current);
  return items.map(item => {
    const grams = clamp(Math.round((item.quantityGrams * ratio) / 5) * 5, 20, 700);
    const perGram = item.quantityGrams > 0 ? item.quantityGrams : 1;
    const factor = grams / perGram;
    return {
      ...item,
      quantityGrams: grams,
      servingDescription: `${grams}g`,
      calories: Math.round(item.calories * factor),
      protein: Math.round(item.protein * factor * 10) / 10,
      carbs: Math.round(item.carbs * factor * 10) / 10,
      fat: Math.round(item.fat * factor * 10) / 10,
      estimatedCost: Math.round(item.estimatedCost * factor * 10) / 10,
    };
  });
}

export function generateLocalPlan(input: PlanGenerationInput): MealPlan {
  const { profile, goal, preferences, budget, targets, foods, startDate } = input;
  const allowed = foods.filter(food => isFoodAllowed(food, preferences));
  const usable = allowed.length > 0 ? allowed : foods;
  const preferred = preferences.preferredFoods;

  const byMeal = new Map<MealType, FoodItem[]>();
  MEAL_ORDER.forEach(type => {
    const exact = usable.filter(food => food.mealTypes.includes(type));
    const fallback = usable.filter(food => food.category === 'Fruit' || food.category === 'Vegetable');
    byMeal.set(type, exact.length > 0 ? exact : fallback.length > 0 ? fallback : usable);
  });

  const start = startDate ? new Date(startDate) : new Date();
  const dailyBudget =
    budget.budgetPeriod === 'monthly' ? budget.amount / 30 : budget.amount;

  const days: MealPlanDay[] = Array.from({ length: 7 }).map((_, dayIndex) => {
    const items: MealPlanItem[] = [];
    MEAL_ORDER.forEach((mealType, mealIndex) => {
      const candidates = byMeal.get(mealType) ?? usable;
      const seed = dayIndex * 7 + mealIndex;
      const primary = pickFood(candidates, seed, preferred);
      if (!primary) {
        return;
      }
      const targetCalories = targets.calories * MEAL_RATIOS[mealType];
      const per100 = Math.max(1, primary.caloriesPer100g);
      const primaryGrams = clamp((targetCalories * 0.75 * 100) / per100, 40, 500);
      items.push(buildPlanItem(primary, primaryGrams, mealType));

      const side = chooseSide(usable, primary, mealType, seed, preferred);
      if (side) {
        const sideGrams = clamp(side.servingGrams, 20, 300);
        items.push(buildPlanItem(side, sideGrams, mealType));
      }
    });

    const scaled = dailyBudget > 0 ? scaleDayItems(items, dailyBudget) : items;
    const estimatedCost =
      Math.round(scaled.reduce((sum, item) => sum + item.estimatedCost, 0) * 10) / 10;

    return {
      id: createId('day'),
      planDate: toDateKey(addDays(start, dayIndex)),
      targetCalories: targets.calories,
      estimatedCost,
      currencyCode: budget.currencyCode,
      items: scaled,
    };
  });

  const end = addDays(start, 6);
  return {
    id: createId('plan'),
    title: `${profile.fullName.split(' ')[0] || 'Your'} 7-day plan`,
    startDate: toDateKey(start),
    endDate: toDateKey(end),
    goalSnapshot: goal,
    budgetSnapshot: budget,
    currencyCode: budget.currencyCode,
    status: 'active',
    days,
    createdAt: new Date().toISOString(),
  };
}

export function replacementCandidates(
  request: ReplacementRequest,
): FoodItem[] {
  const { planItem, reason, foods } = request;
  const sameMeal = foods.filter(
    food => food.mealTypes.includes(planItem.mealType) && food.id !== planItem.foodItemId,
  );
  const pool = sameMeal.length > 0 ? sameMeal : foods.filter(f => f.id !== planItem.foodItemId);
  const currentProteinPer100 = planItem.quantityGrams > 0
    ? (planItem.protein / planItem.quantityGrams) * 100
    : 0;

  switch (reason) {
    case 'cheaper':
      return pool.filter(food => foodCost(food, planItem.quantityGrams) < planItem.estimatedCost);
    case 'higher_protein':
      return pool.filter(food => food.proteinPer100g > currentProteinPer100);
    case 'vegetarian':
      return pool.filter(food => {
        const tags = (food.dietaryTags as string[]).map(t => t.toLowerCase());
        return tags.includes('vegetarian') || tags.includes('vegan');
      });
    case 'quick':
      return pool.filter(food =>
        ['Fruit', 'Snack', 'Beverage', 'Dairy'].includes(food.category) ||
        /salad|dahi|boiled|fresh/i.test(`${food.nameEn} ${food.instructions ?? ''}`),
      );
    case 'disliked':
    case 'unavailable':
    default:
      return pool;
  }
}

export function replaceMealItem(
  planItem: MealPlanItem,
  food: FoodItem,
  reason: ReplacementRequest['reason'],
): MealPlanItem {
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
  const built = buildPlanItem(food, grams, planItem.mealType);
  return {
    ...built,
    id: planItem.id,
    completionStatus: false,
  };
}

export function buildGroceryList(
  plan: MealPlan,
  foods: FoodItem[],
  _currencyCode: CurrencyCode,
): GroceryList {
  const foodById = new Map(foods.map(food => [food.id, food]));
  const aggregate = new Map<string, GroceryItem>();

  plan.days.forEach(day => {
    day.items.forEach(item => {
      const existing = aggregate.get(item.foodItemId);
      const food = foodById.get(item.foodItemId);
      const stale = food ? isPriceStale(food) : true;
      if (existing) {
        existing.quantityGrams += item.quantityGrams;
        existing.estimatedCost =
          Math.round((existing.estimatedCost + item.estimatedCost) * 10) / 10;
        existing.priceStale = existing.priceStale || stale;
      } else {
        aggregate.set(item.foodItemId, {
          id: createId('grocery'),
          foodItemId: item.foodItemId,
          name: item.foodName,
          quantityGrams: item.quantityGrams,
          unit: 'g',
          estimatedCost: item.estimatedCost,
          purchased: false,
          priceStale: stale,
        });
      }
    });
  });

  return {
    id: createId('grocery-list'),
    mealPlanId: plan.id,
    title: 'Weekly grocery list',
    status: 'open',
    items: Array.from(aggregate.values()).sort((a, b) => a.name.localeCompare(b.name)),
    createdAt: new Date().toISOString(),
  };
}

export function findFood(foods: FoodItem[], id: string): FoodItem | undefined {
  return foods.find(food => food.id === id);
}

export function seedFoodsFor(countryCode: 'PK' | 'IN', city: string): FoodItem[] {
  return getSeedFoods(countryCode, city);
}

export function planNutritionTotals(day: MealPlanDay): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  return day.items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: Math.round((acc.protein + item.protein) * 10) / 10,
      carbs: Math.round((acc.carbs + item.carbs) * 10) / 10,
      fat: Math.round((acc.fat + item.fat) * 10) / 10,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

export function mealTargets(targets: DailyTargets): Record<MealType, number> {
  return {
    breakfast: Math.round(targets.calories * MEAL_RATIOS.breakfast),
    lunch: Math.round(targets.calories * MEAL_RATIOS.lunch),
    dinner: Math.round(targets.calories * MEAL_RATIOS.dinner),
    snack: Math.round(targets.calories * MEAL_RATIOS.snack),
  };
}
