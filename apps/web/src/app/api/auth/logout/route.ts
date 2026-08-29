import type { NextRequest } from 'next/server';
import { authApiAdapter } from '@/features/auth/api/auth-adapter';
import { privateJsonResponse } from '@/lib/api/authenticated-bff';
import { getAuthCookieNames } from '@/lib/auth/cookies';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { clearBrowserTokens } from '@/lib/auth/token-store';

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
  try {
    if (refreshToken) await authApiAdapter.revokeSession(refreshToken);
  } finally {
    await clearBrowserTokens();
  }
  return privateJsonResponse({ ok: true });
}
