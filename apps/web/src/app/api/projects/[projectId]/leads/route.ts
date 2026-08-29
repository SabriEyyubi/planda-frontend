import type { NextRequest } from 'next/server';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import {
  authenticatedApiRequest,
  privateJsonResponse,
} from '@/lib/api/authenticated-bff';
import {
  InvalidJsonBodyError,
  readJsonRequestWithinLimit,
  RequestBodyTooLargeError,
} from '@/features/operations/server/bounded-request-body';

const MAX_LEAD_BODY_BYTES = 64 * 1024;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  if (!isSameOriginRequest(request.headers))
    return privateJsonResponse({ code: 'CSRF_REJECTED' }, { status: 403 });
  const verification = await authenticatedApiRequest('/me/profile');
  if (verification.error) return verification.error;
  await verification.response?.body?.cancel().catch(() => undefined);
  let body: unknown;
  try {
    body = await readJsonRequestWithinLimit(request, MAX_LEAD_BODY_BYTES);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return privateJsonResponse(
        { code: 'PAYLOAD_TOO_LARGE' },
        { status: 413 },
      );
    }
    if (!(error instanceof InvalidJsonBodyError)) throw error;
    return privateJsonResponse({ code: 'INVALID_JSON' }, { status: 400 });
  }
  const { projectId } = await params;
  const { response, error } = await authenticatedApiRequest(
    `/projects/${encodeURIComponent(projectId)}/leads`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': request.headers.get('idempotency-key') ?? '',
      },
      body: JSON.stringify(body),
    },
  );
  if (error) return error;
  return privateJsonResponse(await response!.json(), {
    status: response!.status,
  });
}
