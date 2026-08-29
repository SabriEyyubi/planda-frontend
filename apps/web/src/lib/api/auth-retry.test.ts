import { describe, expect, it, vi } from 'vitest';
import { ApiError } from './errors';
import { requestWithTokenRefresh } from './auth-retry';

const rotatedTokens = {
  accessToken: 'new-access',
  refreshToken: 'new-refresh',
  accessMaxAge: 900,
  refreshMaxAge: 2_592_000,
};

describe('requestWithTokenRefresh', () => {
  it('rotates cookies and retries exactly once after an expired access token', async () => {
    const request = vi
      .fn<(token: string) => Promise<Response>>()
      .mockRejectedValueOnce(new ApiError('UNAUTHENTICATED', 401))
      .mockResolvedValueOnce(new Response('{}'));
    const rotate = vi.fn(async () => undefined);

    await requestWithTokenRefresh({
      accessToken: 'expired',
      refreshToken: 'refresh',
      request,
      refresh: vi.fn(async () => rotatedTokens),
      rotate,
      clear: vi.fn(async () => undefined),
    });

    expect(request).toHaveBeenCalledTimes(2);
    expect(request).toHaveBeenLastCalledWith('new-access');
    expect(rotate).toHaveBeenCalledWith(rotatedTokens);
  });

  it('clears browser tokens when refresh fails', async () => {
    const clear = vi.fn(async () => undefined);
    await expect(
      requestWithTokenRefresh({
        accessToken: 'expired',
        refreshToken: 'refresh',
        request: vi.fn(async () => {
          throw new ApiError('UNAUTHENTICATED', 401);
        }),
        refresh: vi.fn(async () => null),
        rotate: vi.fn(async () => undefined),
        clear,
      }),
    ).rejects.toMatchObject({ status: 401 });
    expect(clear).toHaveBeenCalledOnce();
  });

  it('preserves browser tokens when refresh coordination is unavailable', async () => {
    const clear = vi.fn(async () => undefined);
    await expect(
      requestWithTokenRefresh({
        accessToken: 'expired',
        refreshToken: 'still-valid-refresh',
        request: vi.fn(async () => {
          throw new ApiError('UNAUTHENTICATED', 401);
        }),
        refresh: vi.fn(async () => {
          throw new ApiError(
            'AUTH_REFRESH_COORDINATION_UNAVAILABLE',
            503,
            'request-503',
          );
        }),
        rotate: vi.fn(async () => undefined),
        clear,
      }),
    ).rejects.toMatchObject({
      status: 503,
      code: 'AUTH_REFRESH_COORDINATION_UNAVAILABLE',
    });
    expect(clear).not.toHaveBeenCalled();
  });
});
