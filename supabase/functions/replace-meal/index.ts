import { errorResponse, handleOptions, HttpError, jsonResponse, readJson } from '../_shared/http.ts';
import { createUserClient, requireUser } from '../_shared/supabase.ts';
import { loadUserContext } from '../_shared/context.ts';
import { fetchFoods } from '../_shared/foods.ts';
import { foodCost } from '../_shared/nutrition.ts';
import {
  buildReplacementItem,
  eligibleFoods,
  replacementCandidates,
} from '../_shared/planner.ts';
import {
  loadPlan,
  loadPlanItemContext,
  recalculateDayCost,
  updatePlanItem,
} from '../_shared/persist.ts';
import type { ReplacementReason } from '../_shared/types.ts';

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
  reason?: string;
  food_item_id?: string;
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

    if (!body.meal_plan_item_id) {
      throw new HttpError(400, 'meal_plan_item_id is required.', 'missing_item_id');
    }
    const reason: ReplacementReason = REASONS.includes(body.reason as ReplacementReason)
      ? (body.reason as ReplacementReason)
      : 'cheaper';

    const context = await loadUserContext(client, user.id);
    const itemContext = await loadPlanItemContext(client, body.meal_plan_item_id);
    const foods = await fetchFoods(
      client,
      context.profile.countryCode,
      context.profile.city,
    );
    const allowed = eligibleFoods(foods, context.preferences);

    let chosen;
    if (body.food_item_id) {
      chosen = allowed.find(
        food =>
          food.id === body.food_item_id &&
          food.id !== itemContext.item.foodItemId &&
          food.mealTypes.includes(itemContext.item.mealType),
      );
      if (!chosen) {
        throw new HttpError(
          400,
          'That food is not an allowed alternative for this meal.',
          'invalid_alternative',
        );
      }
    } else {
      const candidates = replacementCandidates({
        foods: allowed,
        planItem: itemContext.item,
        reason,
      });
      if (candidates.length === 0) {
        throw new HttpError(
          409,
          'No suitable alternatives were found for that request. Try another replacement reason.',
          'no_alternatives',
        );
      }
      if (reason === 'higher_protein') {
        chosen = [...candidates].sort((a, b) => b.proteinPer100g - a.proteinPer100g)[0];
      } else if (reason === 'cheaper') {
        chosen = [...candidates].sort(
          (a, b) =>
            foodCost(a, itemContext.item.quantityGrams) -
            foodCost(b, itemContext.item.quantityGrams),
        )[0];
      } else {
        chosen = candidates[0];
      }
    }

    if (!chosen) {
      throw new HttpError(409, 'No replacement could be selected.', 'no_replacement');
    }

    const replacement = buildReplacementItem({
      food: chosen,
      planItem: itemContext.item,
      reason,
    });

    await updatePlanItem(client, itemContext.itemId, replacement);
    await recalculateDayCost(client, itemContext.dayId, context.budget.currencyCode);

    const plan = await loadPlan(client, itemContext.planId);
    if (!plan) {
      throw new HttpError(500, 'Updated plan could not be loaded.', 'plan_reload_failed');
    }

    return jsonResponse({
      plan,
      replacement: {
        foodId: chosen.id,
        foodName: chosen.nameEn,
        quantityGrams: replacement.quantityGrams,
        calories: replacement.calories,
        protein: replacement.protein,
        carbs: replacement.carbs,
        fat: replacement.fat,
        estimatedCost: replacement.estimatedCost,
        priceStale: chosen.pricePerKg <= 0,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
});
