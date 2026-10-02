import 'server-only';
import { getServerEnv } from '@/lib/config/env';
import { ApiError, normalizeApiError } from './errors';
import { assertRelativeApiPath } from './path';

const DEFAULT_TIMEOUT_MS = 10_000;

export async function serverApiRequest(
  path: string,
  init: RequestInit & { accessToken?: string; timeoutMs?: number } = {},
) {
  const { API_BASE_URL } = getServerEnv();
  const {
    accessToken,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    headers,
    ...requestInit
  } = init;
  const requestHeaders = new Headers(headers);
  if (accessToken) requestHeaders.set('authorization', `Bearer ${accessToken}`);

  try {
    const response = await fetch(
      new URL(`.${assertRelativeApiPath(path)}`, `${API_BASE_URL}/`),
      {
        ...requestInit,
        cache: requestInit.cache ?? (requestInit.next ? undefined : 'no-store'),
        headers: requestHeaders,
        signal: requestInit.signal ?? AbortSignal.timeout(timeoutMs),
      },
    );

    if (!response.ok) {
      // Only these conflict codes are safe UI recovery signals; no backend message is exposed.
      const body: unknown =
        response.status === 409
          ? await response.json().catch(() => null)
          : null;
      const backendCode =
        body && typeof body === 'object' && 'code' in body
          ? body.code
          : undefined;
      throw normalizeApiError(
        response.status,
        response.headers.get('x-request-id') ?? undefined,
        backendCode,
      );
    }
    return response;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw normalizeApiError();
  }
}
