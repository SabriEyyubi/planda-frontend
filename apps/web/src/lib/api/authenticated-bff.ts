import 'server-only';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ApiError } from './errors';
import { serverApiRequest } from './server';
import { requestWithTokenRefresh } from './auth-retry';
import { applyPrivateNoStore } from './private-cache';
import { getAuthCookieNames } from '@/lib/auth/cookies';
import { authApiAdapter } from '@/features/auth/api/auth-adapter';
import { clearBrowserTokens, storeBrowserTokens } from '@/lib/auth/token-store';
import { refreshSingleFlight } from '@/lib/auth/refresh-single-flight';

export async function authenticatedApiRequest(
  path: string,
  init: RequestInit = {},
) {
  const store = await cookies();
  const names = getAuthCookieNames();
  const accessToken = store.get(names.access)?.value;
  const refreshToken = store.get(names.refresh)?.value;

  try {
    return {
      response: await requestWithTokenRefresh({
        accessToken,
        refreshToken,
        request: (token) =>
          serverApiRequest(path, { ...init, accessToken: token }),
        refresh: (token) =>
          refreshSingleFlight(token, authApiAdapter.refreshSession),
        rotate: storeBrowserTokens,
        clear: clearBrowserTokens,
      }),
      error: null,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        response: null,
        error: authError(error.status ?? 500, error.code, error.requestId),
      };
    }
    return { response: null, error: authError(500, 'SERVER_ERROR') };
  }
}

function authError(status: number, code: string, requestId?: string) {
  const response = privateJsonResponse(
    { code, ...(requestId ? { requestId } : {}) },
    { status },
  );
  if (requestId) response.headers.set('x-request-id', requestId);
  return response;
}

export function privateJsonResponse(
  body: unknown,
  init?: ResponseInit,
): NextResponse {
  const response = NextResponse.json(body, init);
  return applyPrivateNoStore(response);
}

export function privateEmptyResponse(init?: ResponseInit): NextResponse {
  const response = new NextResponse(null, init);
  return applyPrivateNoStore(response);
}
