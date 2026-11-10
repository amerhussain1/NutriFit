# Gemini setup

Gemini is optional. It is called only from the `generate-diet-plan` and
`explain-meal` Edge Functions. The mobile app never sees the API key.

## Behavior

- If `GEMINI_API_KEY` is missing, plan generation uses a deterministic,
  database-backed planner and still returns a valid 7-day plan.
- If Gemini fails, times out or returns invalid JSON, the same fallback is used
  and the response includes warnings plus `generation_metadata.aiError`.
- The server validates every returned food ID against the eligible catalogue,
  recalculates nutrition and cost, enforces allergies/diet, and ignores invented
  foods. Gemini output is never trusted directly.
- Requests have a 25 second timeout for plans and 20 seconds for explanations.

## 1. Create a key

1. Open Google AI Studio and create an API key.
2. Restrict the key to the Generative Language API if your account supports key
   restrictions.
3. Do not paste the key into `.env`, source code, screenshots or chat.

## 2. Store it as a function secret

```powershell
supabase secrets set GEMINI_API_KEY=<rotated-key>
supabase secrets set GEMINI_MODEL=gemini-2.5-flash
```

`supabase secrets list` shows names only, not values. Repeat the command when
rotating the key.

If the key was ever shared in plain text, rotate it before deployment. The old
key must be revoked, not just replaced in the app.

## 3. Deploy the functions

```powershell
supabase functions deploy generate-diet-plan
supabase functions deploy explain-meal
```

Secrets are injected at runtime. Redeploying is not required after changing a
secret, but a running instance may need a moment to pick it up.

## 4. Model and cost

The default model is `gemini-2.5-flash`. Override it with the `GEMINI_MODEL`
secret. Flash is chosen for latency and cost. Every plan generation is one
request; a user-triggered generation should be rate-limited in the product if
usage grows.

The prompt asks for structured JSON with an explicit response schema. Do not
switch to free-form output without keeping server-side parsing and validation.

## 5. Test the fallback

1. Deploy without `GEMINI_API_KEY`.
2. Generate a plan in the app.
3. Confirm the plan is created and the response contains a warning such as
   `GEMINI_API_KEY is not configured`.

Then set the key, generate again, and confirm
`generation_metadata.source` is `gemini` and the plan still totals correctly.

## 6. Manual request

Use a real user access token, never the service-role key:

```powershell
$token = "<user-access-token>"
$key = "<publishable-key>"
Invoke-RestMethod -Method Post `
  -Uri "https://<project-ref>.supabase.co/functions/v1/generate-diet-plan" `
  -Headers @{ Authorization = "Bearer $token"; apikey = $key; "Content-Type" = "application/json" } `
  -Body '{"start_date":"2026-11-06"}'
```

Expected response:

```json
{ "plan": { "...": "nested meal_plan_days and meal_plan_items" }, "warnings": [] }
```

## Safety

- Nutrition and cost figures are estimates and not medical advice.
- Allergies are enforced with catalogue allergen tags. Keep those tags accurate
  when adding food records.
- Gemini is not used to diagnose, treat or prescribe anything.
