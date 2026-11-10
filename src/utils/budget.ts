import type { BudgetPeriod, FoodItem, MealPlan, UserBudget } from '../types';

export const STALE_PRICE_DAYS = 45;

export function dailyBudgetAmount(budget: UserBudget, daysInMonth = 30): number {
  const amount = Math.max(0, budget.amount);
  return budget.budgetPeriod === 'monthly' ? amount / daysInMonth : amount;
}

export function foodCost(food: FoodItem, grams: number): number {
  const cost = (grams / 1000) * food.pricePerKg;
  return Math.round(cost * 10) / 10;
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

export function planTotalCost(plan: MealPlan): number {
  return Math.round(
    plan.days.reduce((sum, day) => sum + day.estimatedCost, 0) * 10,
  ) / 10;
}

export function weeklyGroceryEstimate(plan: MealPlan): number {
  return planTotalCost(plan);
}

export function budgetValidation(params: {
  estimatedCost: number;
  dailyBudget: number;
}): { ok: boolean; overBy: number } {
  const overBy = Math.max(0, Math.round((params.estimatedCost - params.dailyBudget) * 10) / 10);
  return { ok: overBy <= 0, overBy };
}

export function formatBudgetPeriod(period: BudgetPeriod): 'perDay' | 'perMonth' {
  return period === 'monthly' ? 'perMonth' : 'perDay';
}
