// Regenerates the starter food catalogue SQL from src/constants/foodSeed.ts.
// Run with: node scripts/generate-food-seed.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const source = fs.readFileSync(path.join(root, 'src/constants/foodSeed.ts'), 'utf8');

function extractLiteral(marker, endMarker) {
  const start = source.indexOf(marker);
  if (start === -1) {
    throw new Error(`Could not find marker: ${marker}`);
  }
  const literalStart = source.indexOf('=', start) + 1;
  const end = source.indexOf(endMarker, literalStart);
  if (end === -1) {
    throw new Error(`Could not find end marker for: ${marker}`);
  }
  return source
    .slice(literalStart, end + endMarker.length)
    .trim()
    .replace(/;$/, '');
}

const foods = new Function(`return ${extractLiteral('const foods: SeedFood[] = [', '\n];')}`)();
const cityFactors = new Function(
  `return ${extractLiteral('const cityFactors: Record<string, number> = {', '\n};')}`,
)();

const PK_CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta'];
const IN_CITIES = ['Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad'];

const quote = value => `'${String(value).replace(/'/g, "''")}'`;
const textArray = values => `array[${values.map(quote).join(', ')}]::text[]`;
const nullable = value => (value == null ? 'null' : quote(value));
const round = value => Math.round(value * 100) / 100;

const itemLines = [];
const servingLines = [];
const priceLines = [];

for (const food of foods) {
  itemLines.push(
    `  (${quote(food.id)}, ${quote(food.nameEn)}, ${nullable(food.nameUr)}, ${nullable(
      food.nameRomanUr,
    )}, ${nullable(food.nameHi ?? null)}, ${textArray(['PK', 'IN'])}, ${quote(food.category)}, ${textArray(
      food.tags,
    )}, ${textArray(food.allergens)}, ${textArray(food.meals)}, ${round(food.kcal)}, ${round(
      food.protein,
    )}, ${round(food.carbs)}, ${round(food.fat)}, ${round(food.fiber)}, ${quote(
      food.instructions,
    )}, ${quote('Seed starter dataset (USDA/IFCT-derived, verify before production)')}, true)`,
  );

  servingLines.push(
    `  (${quote(food.id)}, ${quote(food.serving)}, ${round(food.servingGrams)})`,
  );

  for (const city of PK_CITIES) {
    priceLines.push(
      `  (${quote(food.id)}, 'PK', ${quote(city)}, ${round(
        food.pkrKg * (cityFactors[city] ?? 1),
      )}, 'PKR')`,
    );
  }
  for (const city of IN_CITIES) {
    priceLines.push(
      `  (${quote(food.id)}, 'IN', ${quote(city)}, ${round(
        food.inrKg * (cityFactors[city] ?? 1),
      )}, 'INR')`,
    );
  }
}

const sql = `-- NutriFit starter food catalogue.
-- Generated from src/constants/foodSeed.ts by scripts/generate-food-seed.mjs.
-- These are seed estimates, NOT live market prices. Do not present them as
-- verified local prices. Prices are dated and expire so the UI can mark them
-- stale. Replace with admin-verified observations before production use.

begin;

insert into public.food_items (
  canonical_name,
  name_en,
  name_ur,
  name_roman_ur,
  name_hi,
  country_availability,
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
  is_active
)
values
${itemLines.join(',\n')}
on conflict (canonical_name) do update set
  name_en = excluded.name_en,
  name_ur = excluded.name_ur,
  name_roman_ur = excluded.name_roman_ur,
  name_hi = excluded.name_hi,
  country_availability = excluded.country_availability,
  category = excluded.category,
  dietary_tags = excluded.dietary_tags,
  allergen_tags = excluded.allergen_tags,
  meal_types = excluded.meal_types,
  calories_per_100g = excluded.calories_per_100g,
  protein_per_100g = excluded.protein_per_100g,
  carbs_per_100g = excluded.carbs_per_100g,
  fat_per_100g = excluded.fat_per_100g,
  fiber_per_100g = excluded.fiber_per_100g,
  preparation_notes = excluded.preparation_notes,
  source_name = excluded.source_name,
  is_active = true,
  updated_at = now();

delete from public.food_servings
where food_item_id in (select id from public.food_items where canonical_name = any(array[${foods
  .map(food => quote(food.id))
  .join(', ')}]::text[]));

insert into public.food_servings (food_item_id, serving_name, grams)
select f.id, v.serving_name, v.grams
from (
  values
${servingLines.join(',\n')}
) as v(canonical_name, serving_name, grams)
join public.food_items f on f.canonical_name = v.canonical_name;

delete from public.food_prices
where food_item_id in (select id from public.food_items where canonical_name = any(array[${foods
  .map(food => quote(food.id))
  .join(', ')}]::text[]));

insert into public.food_prices (
  food_item_id,
  country_code,
  city,
  price_amount,
  currency_code,
  quantity_amount,
  quantity_unit,
  price_source,
  observed_at,
  valid_until
)
select
  f.id,
  v.country_code,
  v.city,
  v.price_amount,
  v.currency_code,
  1000,
  'g',
  'Seed estimate - verify local market price',
  '2026-11-05T00:00:00Z'::timestamptz,
  '2026-12-05T00:00:00Z'::timestamptz
from (
  values
${priceLines.join(',\n')}
) as v(canonical_name, country_code, city, price_amount, currency_code)
join public.food_items f on f.canonical_name = v.canonical_name;

commit;
`;

const outputDir = path.join(root, 'supabase/seed');
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, '0001_food_catalogue.sql'), sql, 'utf8');
console.log(`Wrote ${foods.length} foods, ${servingLines.length} servings, ${priceLines.length} prices.`);
