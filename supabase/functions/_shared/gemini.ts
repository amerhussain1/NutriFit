import { HttpError } from './http.ts';
import type { AiSelection, DailyTargets, FoodItem, UserBudget, UserPreferences } from './types.ts';

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    days: {
      type: 'ARRAY',
      description: 'Exactly seven days, day_index 0 through 6 in order.',
      items: {
        type: 'OBJECT',
        properties: {
          day_index: { type: 'INTEGER', description: '0-based index of the day.' },
          meals: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                meal_type: {
                  type: 'STRING',
                  enum: ['breakfast', 'lunch', 'dinner', 'snack'],
                },
                items: {
                  type: 'ARRAY',
                  items: {
                    type: 'OBJECT',
                    properties: {
                      food_id: { type: 'STRING', description: 'An id from the provided food list.' },
                      grams: { type: 'NUMBER', description: 'Edible portion in grams, 20-700.' },
                      reason: { type: 'STRING', description: 'Short explanation for the choice.' },
                    },
                    required: ['food_id', 'grams'],
                  },
                },
              },
              required: ['meal_type', 'items'],
            },
          },
        },
        required: ['day_index', 'meals'],
      },
    },
  },
  required: ['days'],
};

function foodLine(food: FoodItem): string {
  const price = food.pricePerKg > 0 ? `${food.currencyCode} ${food.pricePerKg}/kg` : 'price unavailable';
  return [
    `id=${food.id}`,
    `name="${food.nameEn}"`,
    `category=${food.category}`,
    `meals=${food.mealTypes.join('|')}`,
    `kcal100g=${food.caloriesPer100g}`,
    `protein100g=${food.proteinPer100g}`,
    `carbs100g=${food.carbsPer100g}`,
    `fat100g=${food.fatPer100g}`,
    `serving=${food.servingGrams}g`,
    `price=${price}`,
    `diet=${food.dietaryTags.join('|') || 'none'}`,
    `allergens=${food.allergenTags.join('|') || 'none'}`,
  ].join(', ');
}

function buildPrompt(params: {
  foods: FoodItem[];
  preferences: UserPreferences;
  budget: UserBudget;
  targets: DailyTargets;
  dailyBudget: number;
  startDate: string;
  language: string;
}): string {
  const { foods, preferences, budget, targets, dailyBudget, startDate, language } = params;
  return [
    'Create a practical 7-day South Asian (Desi) diet plan.',
    `Start date: ${startDate}. Return days with day_index 0-6.`,
    `Daily calorie target: about ${targets.calories} kcal.`,
    `Macro targets: protein ${targets.protein} g, carbs ${targets.carbs} g, fat ${targets.fat} g.`,
    `Budget: ${budget.budgetPeriod} budget ${budget.currencyCode} ${budget.amount}. Approximate daily allowance: ${
      dailyBudget > 0 ? `${budget.currencyCode} ${dailyBudget.toFixed(1)}` : 'not provided'
    }.`,
    `Diet preference: ${preferences.dietType}.`,
    `Allergies (must exclude): ${preferences.allergies.join(', ') || 'none'}.`,
    `Excluded ingredients (must exclude): ${preferences.excludedIngredients.join(', ') || 'none'}.`,
    `Disliked foods (avoid): ${preferences.dislikedFoods.join(', ') || 'none'}.`,
    `Preferred foods (use when suitable): ${preferences.preferredFoods.join(', ') || 'none'}.`,
    `Cooking constraints: ${preferences.cookingConstraints.join(', ') || 'none'}.`,
    `Explain choices briefly in language code: ${language}.`,
    '',
    'RULES:',
    '- Only use food_id values from the list below. Never invent a food.',
    '- Include breakfast, lunch, dinner and snack for every day.',
    '- Use portions between 20 and 700 grams. Prefer 1-3 items per meal.',
    '- Respect every allergy and the diet preference without exception.',
    '- Keep daily estimated cost within the daily allowance when possible.',
    '- Do not output prices, calorie totals or nutrition totals; the server calculates them.',
    '',
    'AVAILABLE FOODS:',
    ...foods.map(foodLine),
  ].join('\n');
}

function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return fenced ? fenced[1].trim() : trimmed;
}

export function isGeminiConfigured(): boolean {
  return Boolean(Deno.env.get('GEMINI_API_KEY'));
}

export async function requestAiSelections(params: {
  foods: FoodItem[];
  preferences: UserPreferences;
  budget: UserBudget;
  targets: DailyTargets;
  dailyBudget: number;
  startDate: string;
  language: string;
}): Promise<{ selections: AiSelection[]; error: string | null }> {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    return { selections: [], error: 'GEMINI_API_KEY is not configured' };
  }

  const model = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash';
  const prompt = buildPrompt(params);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model,
      )}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text:
                  'You are a careful nutrition planning assistant. You only select foods from the provided catalogue. You never invent foods, prices or nutrition values. The server validates and recalculates everything.',
              },
            ],
          },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            topP: 0.9,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json',
            responseSchema: RESPONSE_SCHEMA,
          },
        }),
      },
    );

    if (!response.ok) {
      const detail = await response.text();
      return {
        selections: [],
        error: `Gemini request failed (${response.status}): ${detail.slice(0, 300)}`,
      };
    }

    const payload = await response.json();
    const text = payload?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? '')
      .join('');
    if (!text) {
      return { selections: [], error: 'Gemini returned no text content' };
    }

    let parsed: { days?: unknown };
    try {
      parsed = JSON.parse(stripCodeFence(text));
    } catch {
      return { selections: [], error: 'Gemini returned invalid JSON' };
    }

    if (!parsed || !Array.isArray(parsed.days)) {
      return { selections: [], error: 'Gemini JSON did not contain a days array' };
    }

    const selections = (parsed.days as AiSelection[]).filter(
      day => day && Number.isInteger(Number(day.day_index)) && Array.isArray(day.meals),
    );

    if (selections.length === 0) {
      return { selections: [], error: 'Gemini JSON contained no usable days' };
    }

    return { selections, error: null };
  } catch (error) {
    const message =
      error instanceof Error && error.name === 'AbortError'
        ? 'Gemini request timed out'
        : error instanceof Error
          ? error.message
          : 'Gemini request failed';
    return { selections: [], error: message };
  } finally {
    clearTimeout(timeout);
  }
}

export async function explainMeal(params: {
  mealName: string;
  nutritionSummary: string;
  language: string;
}): Promise<string> {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    throw new HttpError(503, 'Gemini is not configured on the server.', 'gemini_not_configured');
  }
  const model = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model,
      )}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `Explain this meal briefly in language code ${params.language}. Meal: ${
                    params.mealName
                  }. Nutrition: ${params.nutritionSummary}. Mention practical portion advice and do not claim medical benefits. Keep it under 90 words.`,
                },
              ],
            },
          ],
          generationConfig: { temperature: 0.5, maxOutputTokens: 512 },
        }),
      },
    );
    if (!response.ok) {
      throw new HttpError(502, `Gemini request failed (${response.status}).`, 'gemini_error');
    }
    const payload = await response.json();
    const text = payload?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? '')
      .join('');
    if (!text) {
      throw new HttpError(502, 'Gemini returned no explanation.', 'gemini_empty');
    }
    return text.trim();
  } finally {
    clearTimeout(timeout);
  }
}
