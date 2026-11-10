import {
  budgetValidation,
  dailyBudgetAmount,
  foodCost,
  formatBudgetPeriod,
  isPriceStale,
  planTotalCost,
} from '../src/utils/budget';
import type { FoodItem, MealPlan, UserBudget } from '../src/types';

const maintenanceBudget: UserBudget = {
  budgetPeriod: 'monthly',
  amount: 30000,
  currencyCode: 'PKR',
  countryCode: 'PK',
  city: 'Karachi',
};

function food(overrides: Partial<FoodItem> = {}): FoodItem {
  return {
    id: 'food-1',
    canonicalName: 'food-1',
    nameEn: 'Food',
    category: 'Other',
    dietaryTags: [],
    allergenTags: [],
    mealTypes: ['lunch'],
    caloriesPer100g: 100,
    proteinPer100g: 5,
    carbsPer100g: 10,
    fatPer100g: 2,
    servingName: '100g',
    servingGrams: 100,
    pricePerKg: 120,
    currencyCode: 'PKR',
    priceSource: 'test',
    priceObservedAt: '2026-11-01T00:00:00Z',
    priceValidUntil: '2026-12-01T00:00:00Z',
    sourceName: 'test',
    verified: true,
    ...overrides,
  };
}

describe('budget engine', () => {
  it('converts a monthly budget to a daily allowance', () => {
    expect(dailyBudgetAmount(maintenanceBudget)).toBe(1000);
    expect(dailyBudgetAmount({ ...maintenanceBudget, amount: 0 })).toBe(0);
  });

  it('calculates ingredient cost from price per kg', () => {
    expect(foodCost(food(), 250)).toBe(30);
    expect(foodCost(food({ pricePerKg: 0 }), 250)).toBe(0);
  });

  it('flags missing, expired and old prices as stale', () => {
    const now = new Date('2026-11-06T00:00:00Z');
    expect(isPriceStale(food(), now)).toBe(false);
    expect(isPriceStale(food({ priceValidUntil: '2026-11-05T00:00:00Z' }), now)).toBe(true);
    expect(isPriceStale(food({ priceValidUntil: null, priceObservedAt: '2026-09-01T00:00:00Z' }), now)).toBe(
      true,
    );
    expect(isPriceStale(food({ pricePerKg: 0 }), now)).toBe(true);
  });

  it('validates a daily budget', () => {
    expect(budgetValidation({ estimatedCost: 900, dailyBudget: 1000 }).ok).toBe(true);
    expect(budgetValidation({ estimatedCost: 1050, dailyBudget: 1000 })).toEqual({
      ok: false,
      overBy: 50,
    });
  });

  it('sums plan cost and formats budget periods', () => {
    const plan = {
      days: [{ estimatedCost: 123.4 }, { estimatedCost: 76.6 }],
    } as MealPlan;
    expect(planTotalCost(plan)).toBe(200);
    expect(formatBudgetPeriod('monthly')).toBe('perMonth');
    expect(formatBudgetPeriod('daily')).toBe('perDay');
  });
});
