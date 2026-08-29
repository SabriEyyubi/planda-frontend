import type { NextRequest } from 'next/server';
import {
  authenticatedApiRequest,
  privateEmptyResponse,
  privateJsonResponse,
} from '@/lib/api/authenticated-bff';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { allowedOperationsPath } from '@/features/operations/model/operations-path';
import {
  InvalidJsonBodyError,
  readJsonRequestWithinLimit,
  readRequestBodyWithinLimit,
  RequestBodyTooLargeError,
} from '@/features/operations/server/bounded-request-body';

type Context = { params: Promise<{ area: string; segments: string[] }> };
const MAX_MULTIPART_BODY_BYTES = 10 * 1024 * 1024 + 64 * 1024;
const MAX_JSON_BODY_BYTES = 1024 * 1024;

async function forward(request: NextRequest, context: Context) {
  const { area, segments } = await context.params;
  const path = allowedOperationsPath(request.method, area, segments);
  if (!path) return privateJsonResponse({ code: 'NOT_FOUND' }, { status: 404 });
  if (request.method !== 'GET' && !isSameOriginRequest(request.headers)) {
    return privateJsonResponse({ code: 'CSRF_REJECTED' }, { status: 403 });
  }
  const search = request.nextUrl.searchParams.toString();
  const hasBody = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);
  let body: BodyInit | undefined;
  let contentType: string | null = null;
  if (hasBody) {
    contentType = request.headers.get('content-type');
    const isMultipart = contentType?.startsWith('multipart/form-data');
    const isJson = contentType?.includes('application/json');
    if (isMultipart || isJson) {
      const verification = await authenticatedApiRequest('/me/profile');
      if (verification.error) return verification.error;
      await verification.response?.body?.cancel().catch(() => undefined);
    }
    try {
      if (isMultipart) {
        body = await readRequestBodyWithinLimit(
          request,
          MAX_MULTIPART_BODY_BYTES,
        );
      } else if (isJson) {
        body = JSON.stringify(
          await readJsonRequestWithinLimit(request, MAX_JSON_BODY_BYTES),
        );
        contentType = 'application/json';
      }
    } catch (error) {
      if (error instanceof RequestBodyTooLargeError) {
        return privateJsonResponse(
          { code: 'PAYLOAD_TOO_LARGE' },
          { status: 413 },
        );
      }
      if (error instanceof InvalidJsonBodyError) {
        return privateJsonResponse({ code: 'INVALID_JSON' }, { status: 400 });
      }
      throw error;
    }
  }
  const { response, error } = await authenticatedApiRequest(
    `${path}${search ? `?${search}` : ''}`,
    {
      method: request.method,
      ...(hasBody
        ? {
            ...(contentType
              ? { headers: { 'content-type': contentType } }
              : {}),
            ...(body !== undefined ? { body } : {}),
          }
        : {}),
    },
  );
  if (error) return error;
  if (response!.status === 204) return privateEmptyResponse({ status: 204 });
  return privateJsonResponse(await response!.json(), {
    status: response!.status,
  });
}

export const GET = forward;
export const PATCH = forward;
export const POST = forward;
export const PUT = forward;
export const DELETE = forward;
