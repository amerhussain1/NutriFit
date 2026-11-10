import { errorResponse, handleOptions, HttpError, jsonResponse, readJson } from '../_shared/http.ts';
import { createUserClient, requireUser } from '../_shared/supabase.ts';
import { loadUserContext } from '../_shared/context.ts';
import { fetchFoods } from '../_shared/foods.ts';
import { foodCost, isPriceStale, nutritionForQuantity } from '../_shared/nutrition.ts';
import { eligibleFoods, replacementCandidates } from '../_shared/planner.ts';
import { loadPlanItemContext } from '../_shared/persist.ts';
import type { FoodItem, PlanItemDraft, ReplacementReason } from '../_shared/types.ts';

const REASONS: ReplacementReason[] = [
  'cheaper',
  'higher_protein',
  'vegetarian',
  'quick',
  'disliked',
  'unavailable',
];

interface Body {
  meal_plan_item_id?: string;
  food_item_id?: string;
  reason?: string;
}

function alternativeFor(food: FoodItem, portionGrams: number) {
  const nutrition = nutritionForQuantity(food, portionGrams);
  return {
    foodId: food.id,
    nameEn: food.nameEn,
    nameUr: food.nameUr,
    nameRomanUr: food.nameRomanUr,
    category: food.category,
    dietaryTags: food.dietaryTags,
    allergenTags: food.allergenTags,
    mealTypes: food.mealTypes,
    caloriesPer100g: food.caloriesPer100g,
    proteinPer100g: food.proteinPer100g,
    carbsPer100g: food.carbsPer100g,
    fatPer100g: food.fatPer100g,
    servingName: food.servingName,
    servingGrams: food.servingGrams,
    pricePerKg: food.pricePerKg,
    currencyCode: food.currencyCode,
    priceSource: food.priceSource,
    priceObservedAt: food.priceObservedAt,
    priceValidUntil: food.priceValidUntil,
    priceStale: isPriceStale(food),
    portionGrams,
    estimatedCost: foodCost(food, portionGrams),
    nutrition,
  };
}

Deno.serve(async req => {
  const preflight = handleOptions(req);
  if (preflight) {
    return preflight;
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Use POST.' }, 405);
  }

  try {
    const client = createUserClient(req);
    const user = await requireUser(client);
    const body = await readJson<Body>(req);

    if (!body.meal_plan_item_id && !body.food_item_id) {
      throw new HttpError(
        400,
        'Provide meal_plan_item_id or food_item_id.',
        'missing_reference',
      );
    }

    const reason: ReplacementReason = REASONS.includes(body.reason as ReplacementReason)
      ? (body.reason as ReplacementReason)
      : 'cheaper';

    const context = await loadUserContext(client, user.id);
    const foods = await fetchFoods(
      client,
      context.profile.countryCode,
      context.profile.city,
    );
    const allowed = eligibleFoods(foods, context.preferences);

    let planItem: PlanItemDraft;
    let portionGrams: number;

    if (body.meal_plan_item_id) {
      const itemContext = await loadPlanItemContext(client, body.meal_plan_item_id);
      planItem = itemContext.item;
      portionGrams = itemContext.item.quantityGrams;
    } else {
      const base = allowed.find(food => food.id === body.food_item_id);
      if (!base) {
        throw new HttpError(404, 'Food not found or not allowed by your preferences.', 'food_not_found');
      }
      portionGrams = 100;
      planItem = {
        foodItemId: base.id,
        foodName: base.nameEn,
        mealType: base.mealTypes[0] ?? 'lunch',
        quantityGrams: 100,
        servingDescription: '100g',
        calories: Math.round(base.caloriesPer100g),
        protein: Math.round(base.proteinPer100g * 10) / 10,
        carbs: Math.round(base.carbsPer100g * 10) / 10,
        fat: Math.round(base.fatPer100g * 10) / 10,
        estimatedCost: foodCost(base, 100),
        preparationInstructions: base.instructions,
        completionStatus: false,
      };
    }

    const candidates = replacementCandidates({ foods: allowed, planItem, reason });
    const pool = candidates.length > 0 ? candidates : allowed.filter(food => food.id !== planItem.foodItemId);

    const sorted = [...pool].sort((a, b) => {
      if (reason === 'higher_protein') {
        return b.proteinPer100g - a.proteinPer100g;
      }
      if (reason === 'cheaper') {
        return foodCost(a, portionGrams) - foodCost(b, portionGrams);
      }
      return a.nameEn.localeCompare(b.nameEn);
    });

    const alternatives = sorted.slice(0, 10).map(food => alternativeFor(food, portionGrams));

    return jsonResponse({
      reason,
      portionGrams,
      currencyCode: context.budget.currencyCode,
      alternatives,
      note:
        'Prices are database estimates and may be stale. Totals are recalculated by the server when a replacement is saved.',
    });
  } catch (error) {
    return errorResponse(error);
  }
});
