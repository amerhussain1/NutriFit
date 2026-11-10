import { errorResponse, handleOptions, jsonResponse, readJson } from '../_shared/http.ts';
import { createUserClient, requireUser } from '../_shared/supabase.ts';
import { loadUserContext } from '../_shared/context.ts';
import { fetchFoods } from '../_shared/foods.ts';
import { dailyBudgetAmount } from '../_shared/nutrition.ts';
import { generatePlanDraft } from '../_shared/planner.ts';
import { isGeminiConfigured, requestAiSelections } from '../_shared/gemini.ts';
import { savePlanDraft } from '../_shared/persist.ts';
import type { AiSelection } from '../_shared/types.ts';

interface Body {
  start_date?: string;
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
    const foods = await fetchFoods(
      client,
      context.profile.countryCode,
      context.profile.city,
    );
    const dailyBudget = dailyBudgetAmount(context.budget);
    const startDate = body.start_date ?? new Date().toISOString().slice(0, 10);

    let selections: AiSelection[] = [];
    let aiError: string | null = isGeminiConfigured()
      ? 'Gemini was not attempted'
      : 'GEMINI_API_KEY is not configured; a deterministic database-backed plan was generated';

    if (isGeminiConfigured()) {
      const result = await requestAiSelections({
        foods,
        preferences: context.preferences,
        budget: context.budget,
        targets: context.targets,
        dailyBudget,
        startDate,
        language: context.profile.language,
      });
      selections = result.selections;
      aiError = result.error;
    }

    const source = selections.length > 0 ? 'gemini' : 'deterministic_fallback';
    const { draft, warnings } = generatePlanDraft({
      profileName: context.profile.fullName,
      goal: context.goal,
      budget: context.budget,
      targets: context.targets,
      preferences: context.preferences,
      foods,
      startDate,
      aiSelections: selections,
      source,
      sourceDetail: source === 'gemini' ? 'Selection validated against the database' : aiError ?? undefined,
    });

    draft.generationMetadata = {
      ...draft.generationMetadata,
      aiError: source === 'gemini' ? null : aiError,
      calorieNotes: context.calorieNotes,
    };

    const plan = await savePlanDraft(client, user.id, draft);
    return jsonResponse({ plan, warnings });
  } catch (error) {
    return errorResponse(error);
  }
});
