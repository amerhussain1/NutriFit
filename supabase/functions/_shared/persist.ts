import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { HttpError } from './http.ts';
import type { PlanDraft, PlanItemDraft } from './types.ts';

const PLAN_SELECT = '*, meal_plan_days(*, meal_plan_items(*))';

export async function loadPlan(client: SupabaseClient, planId: string) {
  const { data, error } = await client
    .from('meal_plans')
    .select(PLAN_SELECT)
    .eq('id', planId)
    .maybeSingle();
  if (error) {
    throw new HttpError(500, error.message, 'plan_load_failed');
  }
  return data;
}

async function insertItems(
  client: SupabaseClient,
  planDayId: string,
  items: PlanItemDraft[],
): Promise<void> {
  if (items.length === 0) {
    return;
  }
  const { error } = await client.from('meal_plan_items').insert(
    items.map(item => ({
      meal_plan_day_id: planDayId,
      food_item_id: item.foodItemId,
      food_name: item.foodName,
      meal_type: item.mealType,
      quantity_grams: item.quantityGrams,
      serving_description: item.servingDescription,
      calories: item.calories,
      protein: item.protein,
      carbohydrates: item.carbs,
      fat: item.fat,
      estimated_cost: item.estimatedCost,
      preparation_instructions: item.preparationInstructions,
      completion_status: false,
    })),
  );
  if (error) {
    throw new HttpError(500, error.message, 'plan_item_insert_failed');
  }
}

export async function savePlanDraft(
  client: SupabaseClient,
  userId: string,
  draft: PlanDraft,
): Promise<Record<string, unknown>> {
  const { data: plan, error } = await client
    .from('meal_plans')
    .insert({
      user_id: userId,
      title: draft.title,
      start_date: draft.startDate,
      end_date: draft.endDate,
      goal_snapshot: draft.goalSnapshot,
      budget_snapshot: draft.budgetSnapshot,
      currency_code: draft.currencyCode,
      status: 'active',
      generation_metadata: draft.generationMetadata,
    })
    .select('id')
    .single();

  if (error || !plan) {
    throw new HttpError(500, error?.message ?? 'Could not save the plan.', 'plan_insert_failed');
  }

  try {
    for (const day of draft.days) {
      const { data: insertedDay, error: dayError } = await client
        .from('meal_plan_days')
        .insert({
          meal_plan_id: plan.id,
          plan_date: day.planDate,
          target_calories: day.targetCalories,
          estimated_cost: day.estimatedCost,
          currency_code: day.currencyCode,
        })
        .select('id')
        .single();
      if (dayError || !insertedDay) {
        throw new HttpError(500, dayError?.message ?? 'Could not save a plan day.', 'plan_day_insert_failed');
      }
      await insertItems(client, insertedDay.id, day.items);
    }

    await client
      .from('meal_plans')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('status', 'active')
      .neq('id', plan.id);

    const saved = await loadPlan(client, plan.id);
    if (!saved) {
      throw new HttpError(500, 'Saved plan could not be reloaded.', 'plan_reload_failed');
    }
    return saved as Record<string, unknown>;
  } catch (error) {
    await client.from('meal_plans').delete().eq('id', plan.id);
    if (error instanceof HttpError) {
      throw error;
    }
    throw new HttpError(
      500,
      error instanceof Error ? error.message : 'Could not save the plan.',
      'plan_save_failed',
    );
  }
}

export interface PlanItemContext {
  item: PlanItemDraft;
  itemId: string;
  dayId: string;
  planId: string;
}

export async function loadPlanItemContext(
  client: SupabaseClient,
  itemId: string,
): Promise<PlanItemContext> {
  const { data, error } = await client
    .from('meal_plan_items')
    .select('*, meal_plan_days(id, meal_plan_id)')
    .eq('id', itemId)
    .maybeSingle();
  if (error) {
    throw new HttpError(500, error.message, 'meal_lookup_failed');
  }
  if (!data) {
    throw new HttpError(404, 'Meal not found.', 'meal_not_found');
  }
  const day = data.meal_plan_days as { id: string; meal_plan_id: string } | null;
  if (!day) {
    throw new HttpError(404, 'Meal day not found.', 'meal_day_not_found');
  }
  const item: PlanItemDraft = {
    foodItemId: String(data.food_item_id ?? ''),
    foodName: String(data.food_name ?? 'Meal'),
    mealType: data.meal_type,
    quantityGrams: Number(data.quantity_grams ?? 0),
    servingDescription: String(data.serving_description ?? ''),
    calories: Number(data.calories ?? 0),
    protein: Number(data.protein ?? 0),
    carbs: Number(data.carbohydrates ?? 0),
    fat: Number(data.fat ?? 0),
    estimatedCost: Number(data.estimated_cost ?? 0),
    preparationInstructions: String(data.preparation_instructions ?? ''),
    completionStatus: Boolean(data.completion_status),
  };
  return { item, itemId: data.id, dayId: day.id, planId: day.meal_plan_id };
}

export async function updatePlanItem(
  client: SupabaseClient,
  itemId: string,
  item: PlanItemDraft,
): Promise<void> {
  const { error } = await client
    .from('meal_plan_items')
    .update({
      food_item_id: item.foodItemId,
      food_name: item.foodName,
      meal_type: item.mealType,
      quantity_grams: item.quantityGrams,
      serving_description: item.servingDescription,
      calories: item.calories,
      protein: item.protein,
      carbohydrates: item.carbs,
      fat: item.fat,
      estimated_cost: item.estimatedCost,
      preparation_instructions: item.preparationInstructions,
      completion_status: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId);
  if (error) {
    throw new HttpError(500, error.message, 'meal_update_failed');
  }
}

export async function recalculateDayCost(
  client: SupabaseClient,
  dayId: string,
  currencyCode: string,
): Promise<void> {
  const { data, error } = await client
    .from('meal_plan_items')
    .select('estimated_cost')
    .eq('meal_plan_day_id', dayId);
  if (error) {
    throw new HttpError(500, error.message, 'day_cost_failed');
  }
  const total =
    Math.round(
      (data ?? []).reduce((sum, row) => sum + Number(row.estimated_cost ?? 0), 0) * 10,
    ) / 10;
  const { error: updateError } = await client
    .from('meal_plan_days')
    .update({ estimated_cost: total, currency_code: currencyCode })
    .eq('id', dayId);
  if (updateError) {
    throw new HttpError(500, updateError.message, 'day_cost_update_failed');
  }
}
