import type { NextRequest } from 'next/server';
import { serverApiRequest } from '@/lib/api/server';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { storeBrowserTokens } from '@/lib/auth/token-store';
import { privateJsonResponse } from '@/lib/api/authenticated-bff';
import { ApiError } from '@/lib/api/errors';
import {
  InvalidJsonBodyError,
  readJsonRequestWithinLimit,
  RequestBodyTooLargeError,
} from '@/features/operations/server/bounded-request-body';

const MAX_AUTH_BODY_BYTES = 16 * 1024;

type TokenResponse = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ kind: string }> },
) {
  if (!isSameOriginRequest(request.headers))
    return privateJsonResponse({ code: 'CSRF_REJECTED' }, { status: 403 });
  const { kind } = await params;
  if (kind !== 'login' && kind !== 'register')
    return privateJsonResponse({ code: 'NOT_FOUND' }, { status: 404 });
  let payload: { email?: string; password?: string };
  try {
    payload = (await readJsonRequestWithinLimit(
      request,
      MAX_AUTH_BODY_BYTES,
    )) as {
      email?: string;
      password?: string;
    };
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
  try {
    const response = await serverApiRequest(`/auth/${kind}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: payload.email,
        password: payload.password,
      }),
    });
    const tokens = (await response.json()) as TokenResponse;
    await storeBrowserTokens({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessMaxAge: tokens.accessTokenExpiresIn,
      refreshMaxAge: tokens.refreshTokenExpiresIn,
    });
    return privateJsonResponse({ ok: true });
  } catch (error) {
    if (error instanceof ApiError) {
      return privateJsonResponse(
        {
          code: error.code,
          ...(error.requestId ? { requestId: error.requestId } : {}),
        },
        { status: error.status ?? 500 },
      );
    }
    return privateJsonResponse(
      {
        code: kind === 'login' ? 'INVALID_CREDENTIALS' : 'REGISTRATION_FAILED',
      },
      { status: 400 },
    );
  }
}
