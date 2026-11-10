import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { HttpError } from './http.ts';
import type { CountryCode, FoodItem } from './types.ts';

const FOOD_SELECT = `
  id,
  canonical_name,
  name_en,
  name_ur,
  name_roman_ur,
  name_hi,
  category,
  dietary_tags,
  allergen_tags,
  meal_types,
  calories_per_100g,
  protein_per_100g,
  carbs_per_100g,
  fat_per_100g,
  fiber_per_100g,
  preparation_notes,
  source_name,
  verified_at,
  food_servings(serving_name, grams),
  food_prices(country_code, city, price_amount, currency_code, quantity_amount, quantity_unit, price_source, observed_at, valid_until)
`;

type Row = Record<string, unknown>;

function num(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function textArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

export function pricePerKgFrom(price: Row | undefined): number {
  if (!price) {
    return 0;
  }
  const amount = num(price.price_amount);
  const quantity = num(price.quantity_amount, 1) || 1;
  const unit = String(price.quantity_unit ?? 'g').toLowerCase();
  if (unit === 'kg' || unit === 'l') {
    return amount / quantity;
  }
  return (amount / quantity) * 1000;
}

export function mapFoodRow(
  row: Row,
  countryCode: CountryCode,
  city: string,
): FoodItem {
  const prices = Array.isArray(row.food_prices) ? (row.food_prices as Row[]) : [];
  const wantedCity = city.toLowerCase();
  const matched =
    prices.find(
      price =>
        String(price.city ?? '').toLowerCase() === wantedCity &&
        String(price.country_code) === countryCode,
    ) ??
    prices.find(price => String(price.country_code) === countryCode) ??
    prices[0];

  const servings = Array.isArray(row.food_servings) ? (row.food_servings as Row[]) : [];
  const serving = servings[0];

  return {
    id: String(row.id),
    canonicalName: String(row.canonical_name ?? row.name_en ?? row.id),
    nameEn: String(row.name_en ?? row.canonical_name ?? row.id),
    nameUr: row.name_ur == null ? null : String(row.name_ur),
    nameRomanUr: row.name_roman_ur == null ? null : String(row.name_roman_ur),
    nameHi: row.name_hi == null ? null : String(row.name_hi),
    category: String(row.category ?? 'Other'),
    dietaryTags: textArray(row.dietary_tags),
    allergenTags: textArray(row.allergen_tags),
    mealTypes: textArray(row.meal_types) as FoodItem['mealTypes'],
    caloriesPer100g: num(row.calories_per_100g),
    proteinPer100g: num(row.protein_per_100g),
    carbsPer100g: num(row.carbs_per_100g),
    fatPer100g: num(row.fat_per_100g),
    fiberPer100g: row.fiber_per_100g == null ? null : num(row.fiber_per_100g),
    servingName: String(serving?.serving_name ?? '100g'),
    servingGrams: num(serving?.grams, 100) || 100,
    pricePerKg: Math.round(pricePerKgFrom(matched) * 100) / 100,
    currencyCode: (String(matched?.currency_code ?? '') === 'INR' ? 'INR' : 'PKR'),
    priceSource: String(matched?.price_source ?? 'Local price unavailable'),
    priceObservedAt: String(matched?.observed_at ?? new Date(0).toISOString()),
    priceValidUntil: matched?.valid_until == null ? null : String(matched.valid_until),
    sourceName: String(row.source_name ?? 'Unknown source'),
    verified: Boolean(row.verified_at),
    instructions: String(row.preparation_notes ?? ''),
  };
}

export async function fetchFoods(
  client: SupabaseClient,
  countryCode: CountryCode,
  city: string,
): Promise<FoodItem[]> {
  const { data, error } = await client
    .from('food_items')
    .select(FOOD_SELECT)
    .eq('is_active', true)
    .contains('country_availability', [countryCode]);

  if (error) {
    throw new HttpError(500, `Could not load the food catalogue: ${error.message}`, 'catalogue_error');
  }

  const foods = (data ?? [])
    .map(row => mapFoodRow(row as Row, countryCode, city))
    .filter(food => food.caloriesPer100g > 0);

  if (foods.length === 0) {
    throw new HttpError(
      409,
      'No verified food records are available for this country yet. Run the seed migration or add food data.',
      'catalogue_empty',
    );
  }
  return foods;
}
