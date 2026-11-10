export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export class HttpError extends Error {
  status: number;
  code: string;

  constructor(status: number, message: string, code = 'request_failed') {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
  }
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function handleOptions(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  return null;
}

export function errorResponse(error: unknown): Response {
  if (error instanceof HttpError) {
    return jsonResponse({ error: error.message, code: error.code }, error.status);
  }
  const message = error instanceof Error ? error.message : 'Unexpected error';
  return jsonResponse({ error: message, code: 'internal_error' }, 500);
}

export async function readJson<T>(req: Request): Promise<T> {
  try {
    const body = await req.json();
    return (body ?? {}) as T;
  } catch {
    throw new HttpError(400, 'Request body must be valid JSON.', 'invalid_json');
  }
}
