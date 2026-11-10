import { z } from 'zod';

const toNumber = (value: unknown) =>
  typeof value === 'string' ? Number(value.replace(',', '.')) : value;

const numberFromString = (
  message: string,
  min?: number,
  max?: number,
  rangeMessage?: string,
) => {
  let schema = z.number({ message }).finite(message);
  if (min !== undefined) {
    schema = schema.min(min, rangeMessage ?? message);
  }
  if (max !== undefined) {
    schema = schema.max(max, rangeMessage ?? message);
  }
  return z.preprocess(toNumber, schema);
};

const positiveNumberFromString = (message: string, positiveMessage: string) =>
  z.preprocess(toNumber, z.number({ message }).finite(message).positive(positiveMessage));

export const loginSchema = z.object({
  email: z.string().trim().email('invalidEmail'),
  password: z.string().min(8, 'passwordShort'),
});

export const signUpSchema = loginSchema
  .extend({
    fullName: z.string().trim().min(2, 'required'),
    confirmPassword: z.string().min(8, 'passwordShort'),
  })
  .refine(values => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'passwordMismatch',
  });

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('invalidEmail'),
});

export const personalInfoSchema = z.object({
  fullName: z.string().trim().min(2, 'required'),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'required')
    .refine(value => {
      const date = new Date(value);
      return !Number.isNaN(date.getTime()) && date.getTime() < Date.now();
    }, 'required'),
  sex: z.enum(['male', 'female', 'other']),
  heightCm: numberFromString('invalidNumber', 120, 230, 'heightRange'),
  weightKg: numberFromString('invalidNumber', 30, 250, 'weightRange'),
  countryCode: z.enum(['PK', 'IN']),
  city: z.string().trim().min(2, 'required'),
  language: z.enum(['en', 'ur', 'roman-ur']),
  units: z.enum(['metric', 'imperial']),
});

export const goalSchema = z.object({
  goalType: z.enum(['loss', 'gain', 'maintain']),
  targetWeightKg: numberFromString('invalidNumber', 30, 250, 'weightRange'),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
});

export const preferencesSchema = z.object({
  dietType: z.enum(['vegetarian', 'non_vegetarian', 'eggetarian', 'vegan']),
  allergies: z.array(z.string()).default([]),
  excludedIngredients: z.array(z.string()).default([]),
  dislikedFoods: z.array(z.string()).default([]),
  preferredFoods: z.array(z.string()).default([]),
  cookingConstraints: z.array(z.string()).default([]),
  mealSchedule: z.array(z.string()).default([]),
});

export const budgetSchema = z.object({
  budgetPeriod: z.enum(['daily', 'monthly']),
  amount: positiveNumberFromString('invalidNumber', 'budgetRange'),
  currencyCode: z.enum(['PKR', 'INR']),
  countryCode: z.enum(['PK', 'IN']),
  city: z.string().trim().min(2, 'required'),
});

export const foodLogSchema = z.object({
  quantityGrams: numberFromString('invalidNumber', 1, 2000, 'invalidNumber'),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
});

export const weightSchema = z.object({
  weightKg: numberFromString('invalidNumber', 30, 250, 'weightRange'),
  notes: z.string().max(200).optional(),
});

export const waterSchema = z.object({
  quantityMl: z.number().int().min(1).max(5000),
});

export function firstZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'unknown';
}
