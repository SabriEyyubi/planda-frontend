import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  refreshSession: vi.fn(),
  storeBrowserTokens: vi.fn(),
  clearBrowserTokens: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('@/features/auth/api/auth-adapter', () => ({
  authApiAdapter: { refreshSession: mocks.refreshSession },
}));
vi.mock('@/lib/auth/token-store', () => ({
  storeBrowserTokens: mocks.storeBrowserTokens,
  clearBrowserTokens: mocks.clearBrowserTokens,
}));

import { GET, POST } from './route';
import { ApiError } from '@/lib/api/errors';

describe('/api/auth/refresh', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects GET without mutating session state', () => {
    const response = GET();
    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('POST');
    expect(mocks.refreshSession).not.toHaveBeenCalled();
  });

  it('rejects cross-origin POST without mutating session state', async () => {
    const response = await POST(request('refresh-token', 'https://evil.test'));
    expect(response.status).toBe(403);
    expect(mocks.refreshSession).not.toHaveBeenCalled();
  });

  it('rotates cookies after a same-origin POST', async () => {
    const tokens = {
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
      accessMaxAge: 900,
      refreshMaxAge: 2_592_000,
    };
    mocks.refreshSession.mockResolvedValue(tokens);
    const response = await POST(request('refresh-token'));
    expect(mocks.storeBrowserTokens).toHaveBeenCalledWith(tokens);
    expect(response.status).toBe(200);
  });

  it('clears invalid refresh cookies and returns unauthorized', async () => {
    mocks.refreshSession.mockResolvedValue(null);
    const response = await POST(request('invalid-refresh'));
    expect(mocks.clearBrowserTokens).toHaveBeenCalledOnce();
    expect(response.status).toBe(401);
  });

  it('preserves cookies and exposes a retryable 503', async () => {
    mocks.refreshSession.mockRejectedValue(
      new ApiError(
        'AUTH_REFRESH_COORDINATION_UNAVAILABLE',
        503,
        'coordination-request',
      ),
    );
    const response = await POST(request('still-valid-refresh'));
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      code: 'AUTH_REFRESH_COORDINATION_UNAVAILABLE',
      requestId: 'coordination-request',
    });
    expect(mocks.clearBrowserTokens).not.toHaveBeenCalled();
    expect(mocks.storeBrowserTokens).not.toHaveBeenCalled();
  });
});

function request(refreshToken: string, origin = 'http://localhost') {
  return new NextRequest('http://localhost/api/auth/refresh', {
    method: 'POST',
    headers: {
      cookie: `planda-refresh=${refreshToken}`,
      host: 'localhost',
      origin,
    },
  });
}
