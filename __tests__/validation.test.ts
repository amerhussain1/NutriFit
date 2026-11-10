import {
  budgetSchema,
  firstZodError,
  forgotPasswordSchema,
  goalSchema,
  loginSchema,
  personalInfoSchema,
  signUpSchema,
} from '../src/utils/validation';

describe('form validation', () => {
  it('accepts valid login details and rejects bad email/password', () => {
    expect(loginSchema.parse({ email: 'user@example.com', password: 'password123' })).toEqual({
      email: 'user@example.com',
      password: 'password123',
    });
    expect(() => loginSchema.parse({ email: 'not-an-email', password: 'password123' })).toThrow();
    expect(() => loginSchema.parse({ email: 'user@example.com', password: 'short' })).toThrow();
  });

  it('requires matching passwords at sign up', () => {
    expect(() =>
      signUpSchema.parse({
        fullName: 'Test User',
        email: 'user@example.com',
        password: 'password123',
        confirmPassword: 'password124',
      }),
    ).toThrow();
  });

  it('accepts a valid email for password reset', () => {
    expect(forgotPasswordSchema.parse({ email: 'user@example.com' })).toEqual({
      email: 'user@example.com',
    });
  });

  it('coerces numeric strings in personal details', () => {
    const parsed = personalInfoSchema.parse({
      fullName: 'Test User',
      dateOfBirth: '1995-05-10',
      sex: 'female',
      heightCm: '165',
      weightKg: '65.5',
      countryCode: 'PK',
      city: 'Karachi',
      language: 'en',
      units: 'metric',
    });
    expect(parsed.heightCm).toBe(165);
    expect(parsed.weightKg).toBe(65.5);
  });

  it('rejects out-of-range measurements and goals', () => {
    expect(() =>
      personalInfoSchema.parse({
        fullName: 'Test User',
        dateOfBirth: '1995-05-10',
        sex: 'female',
        heightCm: '300',
        weightKg: '65',
        countryCode: 'PK',
        city: 'Karachi',
        language: 'en',
        units: 'metric',
      }),
    ).toThrow();
    expect(() => goalSchema.parse({ goalType: 'loss', targetWeightKg: '5', activityLevel: 'moderate' })).toThrow();
  });

  it('validates budgets and coerces the amount', () => {
    const parsed = budgetSchema.parse({
      budgetPeriod: 'monthly',
      amount: '30000',
      currencyCode: 'PKR',
      countryCode: 'PK',
      city: 'Karachi',
    });
    expect(parsed.amount).toBe(30000);
    expect(() =>
      budgetSchema.parse({
        budgetPeriod: 'daily',
        amount: '0',
        currencyCode: 'PKR',
        countryCode: 'PK',
        city: 'Karachi',
      }),
    ).toThrow();
  });

  it('returns the first readable zod error', () => {
    try {
      loginSchema.parse({ email: 'bad', password: 'short' });
      throw new Error('expected validation to fail');
    } catch (error) {
      expect(firstZodError(error as never)).toBeTruthy();
    }
  });
});
