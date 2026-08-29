import type { NextRequest } from 'next/server';
import {
  authenticatedApiRequest,
  privateJsonResponse,
} from '@/lib/api/authenticated-bff';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import {
  InvalidJsonBodyError,
  readJsonRequestWithinLimit,
  RequestBodyTooLargeError,
} from '@/features/operations/server/bounded-request-body';

const MAX_PROFILE_BODY_BYTES = 16 * 1024;

export async function GET() {
  const { response, error } = await authenticatedApiRequest('/me/profile');
  if (error) return error;
  return privateJsonResponse(await response!.json(), {
    status: response!.status,
  });
}

export async function PATCH(request: NextRequest) {
  if (!isSameOriginRequest(request.headers))
    return privateJsonResponse({ code: 'CSRF_REJECTED' }, { status: 403 });
  const verification = await authenticatedApiRequest('/me/profile');
  if (verification.error) return verification.error;
  await verification.response?.body?.cancel().catch(() => undefined);
  let body: unknown;
  try {
    body = await readJsonRequestWithinLimit(request, MAX_PROFILE_BODY_BYTES);
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
  const { response, error } = await authenticatedApiRequest('/me/profile', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (error) return error;
  return privateJsonResponse(await response!.json(), {
    status: response!.status,
  });
}
