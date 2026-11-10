import { getSeedFoods } from '../src/constants/foodSeed';
import {
  buildGroceryList,
  generateLocalPlan,
  isFoodAllowed,
  planNutritionTotals,
  replacementCandidates,
} from '../src/utils/plan';
import { calculateDailyTargets } from '../src/utils/nutrition';
import { foodCost } from '../src/utils/budget';
import type {
  PlanGenerationInput,
  Profile,
  UserBudget,
  UserGoal,
  UserPreferences,
} from '../src/types';

const profile: Profile = {
  id: 'user-1',
  fullName: 'Ayesha Khan',
  dateOfBirth: '1995-05-10',
  sex: 'female',
  heightCm: 165,
  weightKg: 65,
  countryCode: 'PK',
  city: 'Karachi',
  language: 'en',
  units: 'metric',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const goal: UserGoal = {
  goalType: 'maintain',
  targetWeightKg: 65,
  activityLevel: 'moderate',
};

const preferences: UserPreferences = {
  dietType: 'non_vegetarian',
  allergies: [],
  excludedIngredients: [],
  dislikedFoods: [],
  preferredFoods: [],
  cookingConstraints: [],
  mealSchedule: [],
};

const budget: UserBudget = {
  budgetPeriod: 'daily',
  amount: 5000,
  currencyCode: 'PKR',
  countryCode: 'PK',
  city: 'Karachi',
};

const foods = getSeedFoods('PK', 'Karachi');
const targets = calculateDailyTargets(profile, goal);

const input: PlanGenerationInput = {
  profile,
  goal,
  preferences,
  budget,
  targets,
  foods,
  startDate: '2026-11-06',
};

describe('diet safety rules', () => {
  const chicken = foods.find(food => food.id === 'chicken-curry')!;
  const egg = foods.find(food => food.id === 'egg-omelette')!;
  const roti = foods.find(food => food.id === 'roti')!;

  it('respects vegetarian and vegan preferences', () => {
    expect(isFoodAllowed(chicken, preferences)).toBe(true);
    expect(isFoodAllowed(chicken, { ...preferences, dietType: 'vegetarian' })).toBe(false);
    expect(isFoodAllowed(roti, { ...preferences, dietType: 'vegan' })).toBe(true);
    expect(isFoodAllowed(egg, { ...preferences, dietType: 'vegan' })).toBe(false);
  });

  it('always excludes declared allergies', () => {
    expect(isFoodAllowed(egg, { ...preferences, allergies: ['egg'] })).toBe(false);
    expect(isFoodAllowed(chicken, { ...preferences, allergies: ['egg'] })).toBe(true);
  });

  it('excludes disliked and explicitly excluded foods', () => {
    expect(isFoodAllowed(chicken, { ...preferences, dislikedFoods: ['chicken'] })).toBe(false);
    expect(isFoodAllowed(roti, { ...preferences, excludedIngredients: ['wheat'] })).toBe(false);
  });
});

describe('local plan generation', () => {
  it('creates seven ordered days with meals and positive nutrition', () => {
    const plan = generateLocalPlan(input);
    expect(plan.days).toHaveLength(7);
    expect(plan.startDate).toBe('2026-11-06');
    expect(plan.endDate).toBe('2026-11-12');
    expect(plan.days.map(day => day.planDate)).toEqual([
      '2026-11-06',
      '2026-11-07',
      '2026-11-08',
      '2026-11-09',
      '2026-11-10',
      '2026-11-11',
      '2026-11-12',
    ]);

    for (const day of plan.days) {
      expect(day.items.length).toBeGreaterThan(0);
      expect(day.targetCalories).toBe(targets.calories);
      expect(day.estimatedCost).toBeGreaterThan(0);
      const totals = planNutritionTotals(day);
      expect(totals.calories).toBeGreaterThan(0);
    }
  });

  it('never includes an allergen when a user declares one', () => {
    const plan = generateLocalPlan({ ...input, preferences: { ...preferences, allergies: ['egg'] } });
    const usedIds = new Set(plan.days.flatMap(day => day.items.map(item => item.foodItemId)));
    expect(usedIds.has('egg-omelette')).toBe(false);
    expect(usedIds.has('boiled-egg')).toBe(false);
  });

  it('scales portions down for a lower daily budget', () => {
    const baseline = generateLocalPlan(input);
    const plan = generateLocalPlan({
      ...input,
      budget: { ...budget, amount: 120 },
    });
    expect(plan.days.every(day => day.items.length > 0)).toBe(true);
    plan.days.forEach((day, index) => {
      expect(day.estimatedCost).toBeLessThanOrEqual(baseline.days[index].estimatedCost);
    });
  });
});

describe('meal replacement', () => {
  it('returns cheaper alternatives that really are cheaper', () => {
    const plan = generateLocalPlan(input);
    const item = plan.days[1].items[0];
    const candidates = replacementCandidates({
      planItem: item,
      reason: 'cheaper',
      foods,
      currencyCode: 'PKR',
    });
    expect(candidates.length).toBeGreaterThan(0);
    for (const candidate of candidates) {
      expect(foodCost(candidate, item.quantityGrams)).toBeLessThan(item.estimatedCost);
      expect(candidate.id).not.toBe(item.foodItemId);
    }
  });

  it('returns only higher-protein alternatives when requested', () => {
    const plan = generateLocalPlan(input);
    const item = plan.days[2].items[0];
    const currentPer100 = (item.protein / item.quantityGrams) * 100;
    const candidates = replacementCandidates({
      planItem: item,
      reason: 'higher_protein',
      foods,
      currencyCode: 'PKR',
    });
    for (const candidate of candidates) {
      expect(candidate.proteinPer100g).toBeGreaterThan(currentPer100);
    }
  });
});

describe('grocery list', () => {
  it('combines duplicate foods and keeps positive quantities', () => {
    const plan = generateLocalPlan(input);
    const list = buildGroceryList(plan, foods, 'PKR');
    expect(list.items.length).toBeGreaterThan(0);
    const ids = new Set(list.items.map(item => item.foodItemId));
    expect(ids.size).toBe(list.items.length);
    for (const item of list.items) {
      expect(item.quantityGrams).toBeGreaterThan(0);
      expect(item.estimatedCost).toBeGreaterThanOrEqual(0);
    }
  });
});
