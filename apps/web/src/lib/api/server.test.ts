import { describe, expect, it } from 'vitest';
import { assertRelativeApiPath } from './path';

describe('assertRelativeApiPath', () => {
  it('accepts API paths', () =>
    expect(assertRelativeApiPath('/projects')).toBe('/projects'));
  it.each(['https://evil.test/path', '//evil.test/path', 'projects'])(
    'rejects unsafe path %s',
    (path) => {
      expect(() => assertRelativeApiPath(path)).toThrow(TypeError);
    },
  );
});

import { afterEach, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/config/env', () => ({
  getServerEnv: () => ({ API_BASE_URL: 'http://api.test/api/v1' }),
}));
import { serverApiRequest } from './server';
afterEach(() => vi.unstubAllGlobals());
describe('safe lead recovery errors across server transport', () => {
  it.each(['LEAD_CONSENT_VERSION_MISMATCH', 'IDEMPOTENCY_KEY_REUSED'])(
    'preserves %s without forwarding backend messages',
    async (code) => {
      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockResolvedValue(
            new Response(
              JSON.stringify({ code, message: 'Private backend detail' }),
              { status: 409, headers: { 'x-request-id': 'test-request' } },
            ),
          ),
      );
      await expect(
        serverApiRequest('/projects/example/leads', { method: 'POST' }),
      ).rejects.toMatchObject({
        code,
        status: 409,
        requestId: 'test-request',
        message: code,
      });
    },
  );
  it.each([
    JSON.stringify({ code: 'DATABASE_PASSWORD', message: 'secret' }),
    'not-json',
  ])('retains generic conflict for untrusted payload %s', async (body) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(body, { status: 409 })),
    );
    await expect(
      serverApiRequest('/projects/example/leads'),
    ).rejects.toMatchObject({ code: 'CONFLICT', message: 'CONFLICT' });
  });
});
