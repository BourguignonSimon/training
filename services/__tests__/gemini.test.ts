import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('gemini service', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.stubEnv('VITE_GEMINI_API_KEY', '');
  });

  it('returns the fallback training plan when API key is missing', async () => {
    const { generateTrainingPlan } = await import('../gemini');

    const plan = await generateTrainingPlan(8, 'Intermediate', '2024-01-01');

    expect(plan.sessions).toHaveLength(7);
    expect(plan.focus).toContain('Base');
  });

  it('returns the fallback nutrition plan when API key is missing', async () => {
    const { generateNutritionPlan } = await import('../gemini');

    const plan = await generateNutritionPlan('Base Training');

    expect(plan).toHaveLength(1);
    expect(plan[0].meals.Breakfast.name).toContain('Oatmeal');
  });
});
