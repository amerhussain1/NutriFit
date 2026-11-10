import {
  bmrMifflinStJeor,
  calculateAge,
  calculateDailyTargets,
  macroTargets,
  nutritionForQuantity,
  safeCalorieTarget,
  scaleNutrition,
} from '../src/utils/nutrition';
import type { Profile, UserGoal } from '../src/types';

const profile: Profile = {
  id: 'user-1',
  fullName: 'Test User',
  dateOfBirth: '1995-05-10',
  sex: 'male',
  heightCm: 175,
  weightKg: 70,
  countryCode: 'PK',
  city: 'Karachi',
  language: 'en',
  units: 'metric',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const goal: UserGoal = {
  goalType: 'maintain',
  targetWeightKg: 70,
  activityLevel: 'moderate',
};

describe('nutrition calculations', () => {
  it('calculates age from date of birth', () => {
    expect(calculateAge('2000-01-01', new Date('2026-11-06T00:00:00Z'))).toBe(26);
    expect(calculateAge('2000-12-31', new Date('2026-11-06T00:00:00Z'))).toBe(25);
  });

  it('uses the Mifflin-St Jeor formula', () => {
    expect(
      Math.round(bmrMifflinStJeor({ sex: 'male', weightKg: 70, heightCm: 175, age: 30 }) * 100) / 100,
    ).toBe(1648.75);
    expect(
      Math.round(bmrMifflinStJeor({ sex: 'female', weightKg: 70, heightCm: 175, age: 30 }) * 100) / 100,
    ).toBe(1482.75);
  });

  it('does not apply a deficit to minors', () => {
    const minor = { ...profile, dateOfBirth: '2012-01-01' };
    const result = safeCalorieTarget({
      profile: minor,
      goal: { ...goal, goalType: 'loss' },
    });
    expect(result.target).toBe(result.tdee);
    expect(result.adjusted).toBe(true);
    expect(result.note).toMatch(/Under 18/);
  });

  it('applies a safe loss adjustment with a calorie floor', () => {
    const result = safeCalorieTarget({
      profile,
      goal: { ...goal, goalType: 'loss' },
    });
    expect(result.target).toBeGreaterThanOrEqual(1500);
    expect(result.target).toBeLessThanOrEqual(result.tdee);
  });

  it('produces macros whose energy is close to the target', () => {
    const macros = macroTargets({
      calories: 2000,
      weightKg: 70,
      goalType: 'maintain',
      activityLevel: 'moderate',
    });
    const energy = macros.protein * 4 + macros.carbs * 4 + macros.fat * 9;
    expect(Math.abs(energy - 2000)).toBeLessThan(12);
  });

  it('scales nutrition by quantity', () => {
    const food = {
      caloriesPer100g: 297,
      proteinPer100g: 10.6,
      carbsPer100g: 61.5,
      fatPer100g: 2.2,
    } as const;
    const result = nutritionForQuantity(food as never, 50);
    expect(result.calories).toBe(149);
    expect(result.protein).toBe(5.3);
  });

  it('builds a water target within safe bounds', () => {
    const targets = calculateDailyTargets(profile, goal);
    expect(targets.waterMl).toBeGreaterThanOrEqual(1500);
    expect(targets.waterMl).toBeLessThanOrEqual(4000);
    expect(targets.calories).toBeGreaterThan(0);
  });

  it('rescales stored food-log nutrition when quantity changes', () => {
    const scaled = scaleNutrition(
      { calories: 300, protein: 12, carbs: 40, fat: 8 },
      150,
      100,
    );
    expect(scaled).toEqual({ calories: 200, protein: 8, carbs: 26.7, fat: 5.3 });
    expect(scaleNutrition({ calories: 300, protein: 12, carbs: 40, fat: 8 }, 0, 100)).toEqual({
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    });
  });
});
