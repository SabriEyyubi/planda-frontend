import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api/errors';
import { requestWithTokenRefresh } from '@/lib/api/auth-retry';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/api/server', () => ({ serverApiRequest: vi.fn() }));

import { serverApiRequest } from '@/lib/api/server';
import { authApiAdapter } from './auth-adapter';

const requestApi = vi.mocked(serverApiRequest);

describe('refresh adapter and cookie lifecycle', () => {
  beforeEach(() => vi.resetAllMocks());

  it.each([
    new ApiError('NETWORK_ERROR'),
    new ApiError('RATE_LIMITED', 429),
    new ApiError('SERVER_ERROR', 500),
    new ApiError('SERVER_ERROR', 503),
    new ApiError('FORBIDDEN', 403),
    new SyntaxError('Invalid response'),
  ])('preserves tokens on non-authoritative failure %s', async (error) => {
    requestApi.mockRejectedValueOnce(error);
    const clear = vi.fn();
    const rotate = vi.fn();
    const request = vi.fn();
    await expect(
      requestWithTokenRefresh({
        refreshToken: 'existing-refresh',
        request,
        refresh: authApiAdapter.refreshSession,
        rotate,
        clear,
      }),
    ).rejects.toThrow();
    expect(clear).not.toHaveBeenCalled();
    expect(rotate).not.toHaveBeenCalled();
    expect(request).not.toHaveBeenCalled();
  });

  it('clears tokens on confirmed invalid refresh credentials', async () => {
    requestApi.mockRejectedValueOnce(new ApiError('UNAUTHENTICATED', 401));
    const clear = vi.fn();
    await expect(
      requestWithTokenRefresh({
        refreshToken: 'invalid-refresh',
        request: vi.fn(),
        refresh: authApiAdapter.refreshSession,
        rotate: vi.fn(),
        clear,
      }),
    ).rejects.toMatchObject({ status: 401 });
    expect(clear).toHaveBeenCalledOnce();
  });

  it('maps a successful rotation from the backend contract', async () => {
    requestApi.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          accessToken: 'new-access',
          refreshToken: 'new-refresh',
          accessTokenExpiresIn: 900,
          refreshTokenExpiresIn: 86400,
        }),
      ),
    );
    await expect(authApiAdapter.refreshSession('old-refresh')).resolves.toEqual(
      {
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
        accessMaxAge: 900,
        refreshMaxAge: 86400,
      },
    );
  });
});
