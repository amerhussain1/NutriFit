import { errorResponse, handleOptions, HttpError, jsonResponse } from '../_shared/http.ts';
import { createServiceClient, createUserClient, requireUser } from '../_shared/supabase.ts';

Deno.serve(async req => {
  const preflight = handleOptions(req);
  if (preflight) {
    return preflight;
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Use POST.' }, 405);
  }

  try {
    const userClient = createUserClient(req);
    const user = await requireUser(userClient);
    const service = createServiceClient();

    // Deleting the auth user cascades through profiles, plans, logs,
    // favourites and grocery lists via foreign keys.
    const { error } = await service.auth.admin.deleteUser(user.id);
    if (error) {
      throw new HttpError(500, error.message, 'account_delete_failed');
    }

    return jsonResponse({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
});
