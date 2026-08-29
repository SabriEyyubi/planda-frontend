import type { NextRequest } from 'next/server';
import { authApiAdapter } from '@/features/auth/api/auth-adapter';
import { getAuthCookieNames } from '@/lib/auth/cookies';
import { refreshSingleFlight } from '@/lib/auth/refresh-single-flight';
import { clearBrowserTokens, storeBrowserTokens } from '@/lib/auth/token-store';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { privateJsonResponse } from '@/lib/api/authenticated-bff';
import { ApiError } from '@/lib/api/errors';

export function GET() {
  return privateJsonResponse(
    { code: 'METHOD_NOT_ALLOWED' },
    { status: 405, headers: { Allow: 'POST' } },
  );
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request.headers))
    return privateJsonResponse({ code: 'CSRF_REJECTED' }, { status: 403 });
  const refreshToken = request.cookies.get(getAuthCookieNames().refresh)?.value;
  if (!refreshToken) {
    await clearBrowserTokens();
    return privateJsonResponse({ code: 'UNAUTHENTICATED' }, { status: 401 });
  }
  let tokens;
  try {
    tokens = await refreshSingleFlight(
      refreshToken,
      authApiAdapter.refreshSession,
    );
  } catch (error) {
    if (error instanceof ApiError && (error.status ?? 0) >= 500) {
      return privateJsonResponse(
        {
          code: error.code,
          ...(error.requestId ? { requestId: error.requestId } : {}),
        },
        { status: error.status ?? 503 },
      );
    }
    return privateJsonResponse({ code: 'SERVER_ERROR' }, { status: 500 });
  }
  if (!tokens) {
    await clearBrowserTokens();
    return privateJsonResponse({ code: 'UNAUTHENTICATED' }, { status: 401 });
  }
  await storeBrowserTokens(tokens);
  return privateJsonResponse({ ok: true });
}
