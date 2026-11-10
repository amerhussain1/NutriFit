import { errorResponse, handleOptions, HttpError, jsonResponse, readJson } from '../_shared/http.ts';
import { createUserClient, requireUser } from '../_shared/supabase.ts';
import { loadUserContext } from '../_shared/context.ts';
import { fetchFoods } from '../_shared/foods.ts';
import { nutritionForQuantity } from '../_shared/nutrition.ts';
import { loadPlanItemContext } from '../_shared/persist.ts';
import { explainMeal, isGeminiConfigured } from '../_shared/gemini.ts';

interface Body {
  meal_plan_item_id?: string;
  food_item_id?: string;
}

function templateExplanation(name: string, calories: number, protein: number, carbs: number, fat: number): string {
  return [
    `${name} provides about ${calories} kcal, ${protein} g protein, ${carbs} g carbs and ${fat} g fat for this portion.`,
    'Adjust the portion to your appetite and daily target, and pair it with vegetables or salad for fibre.',
    'This is general guidance, not medical or dietetic advice.',
  ].join(' ');
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
    const context = await loadUserContext(client, user.id);

    let name = 'Meal';
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;

    if (body.meal_plan_item_id) {
      const itemContext = await loadPlanItemContext(client, body.meal_plan_item_id);
      name = itemContext.item.foodName;
      calories = itemContext.item.calories;
      protein = itemContext.item.protein;
      carbs = itemContext.item.carbs;
      fat = itemContext.item.fat;
    } else if (body.food_item_id) {
      const foods = await fetchFoods(
        client,
        context.profile.countryCode,
        context.profile.city,
      );
      const food = foods.find(item => item.id === body.food_item_id);
      if (!food) {
        throw new HttpError(404, 'Food not found.', 'food_not_found');
      }
      const nutrition = nutritionForQuantity(food, 100);
      name = food.nameEn;
      calories = nutrition.calories;
      protein = nutrition.protein;
      carbs = nutrition.carbs;
      fat = nutrition.fat;
    } else {
      throw new HttpError(400, 'Provide meal_plan_item_id or food_item_id.', 'missing_reference');
    }

    const summary = `${calories} kcal, ${protein} g protein, ${carbs} g carbs, ${fat} g fat`;

    if (!isGeminiConfigured()) {
      return jsonResponse({
        explanation: templateExplanation(name, calories, protein, carbs, fat),
        source: 'template',
        note: 'GEMINI_API_KEY is not configured, so a local explanation was returned.',
      });
    }

    try {
      const explanation = await explainMeal({
        mealName: name,
        nutritionSummary: summary,
        language: context.profile.language,
      });
      return jsonResponse({ explanation, source: 'gemini' });
    } catch (error) {
      return jsonResponse({
        explanation: templateExplanation(name, calories, protein, carbs, fat),
        source: 'template',
        note: error instanceof Error ? `AI explanation unavailable: ${error.message}` : 'AI explanation unavailable.',
      });
    }
  } catch (error) {
    return errorResponse(error);
  }
});
