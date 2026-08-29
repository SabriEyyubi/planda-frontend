import { beforeEach, describe, expect, it, vi } from 'vitest';

const cookieValues = vi.hoisted(() => new Map<string, string>());
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => {
      const value = cookieValues.get(name);
      return value ? { value } : undefined;
    },
  })),
}));

import { getAuthCookieNames } from './cookies';
import { getBrowserSession } from './session';

describe('getBrowserSession', () => {
  beforeEach(() => cookieValues.clear());

  it('routes a page entry through refresh when access is missing', async () => {
    cookieValues.set(getAuthCookieNames().refresh, 'refresh-token');
    await expect(getBrowserSession()).resolves.toEqual({
      status: 'refreshable',
    });
  });

  it('routes an invalid access token through refresh when available', async () => {
    const names = getAuthCookieNames();
    cookieValues.set(names.access, 'expired-access');
    cookieValues.set(names.refresh, 'refresh-token');
    await expect(
      getBrowserSession({ verifyAccessToken: vi.fn(async () => null) }),
    ).resolves.toEqual({ status: 'refreshable' });
  });

  it('keeps a failed session unverified without a refresh token', async () => {
    cookieValues.set(getAuthCookieNames().access, 'invalid-access');
    await expect(
      getBrowserSession({ verifyAccessToken: vi.fn(async () => null) }),
    ).resolves.toEqual({ status: 'unverified' });
  });
});
