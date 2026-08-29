import type { NextRequest } from 'next/server';
import { serverApiRequest } from '@/lib/api/server';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import {
  InvalidJsonBodyError,
  readJsonRequestWithinLimit,
  RequestBodyTooLargeError,
} from '@/features/operations/server/bounded-request-body';

const MAX_VIEW_BODY_BYTES = 4 * 1024;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  if (!isSameOriginRequest(request.headers))
    return Response.json({ code: 'CSRF_REJECTED' }, { status: 403 });
  let body: { sessionId?: unknown };
  try {
    body = (await readJsonRequestWithinLimit(request, MAX_VIEW_BODY_BYTES)) as {
      sessionId?: unknown;
    };
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return Response.json({ code: 'PAYLOAD_TOO_LARGE' }, { status: 413 });
    }
    if (!(error instanceof InvalidJsonBodyError)) throw error;
    return Response.json({ code: 'INVALID_JSON' }, { status: 400 });
  }
  if (typeof body.sessionId !== 'string' || body.sessionId.length > 100)
    return Response.json({ code: 'INVALID_SESSION_ID' }, { status: 400 });
  const { projectId } = await params;
  try {
    const response = await serverApiRequest(
      `/projects/${encodeURIComponent(projectId)}/views`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId: body.sessionId }),
      },
    );
    return Response.json(await response.json(), {
      status: response.status,
      headers: { 'cache-control': 'private, no-store' },
    });
  } catch {
    return Response.json(
      { code: 'VIEW_RECORDING_UNAVAILABLE' },
      { status: 503, headers: { 'cache-control': 'private, no-store' } },
    );
  }
}
