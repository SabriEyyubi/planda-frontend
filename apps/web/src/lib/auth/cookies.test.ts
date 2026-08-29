import { describe, expect, it } from 'vitest';
import { authCookieOptions, getAuthCookieNames } from './cookies';

describe('auth cookies', () => {
  it('uses valid non-prefixed development cookies', () => {
    expect(getAuthCookieNames('development').access).toBe('planda-access');
    expect(authCookieOptions(60, 'development').secure).toBe(false);
  });

  it('uses secure __Host cookies in production', () => {
    expect(getAuthCookieNames('production').refresh).toBe(
      '__Host-planda-refresh',
    );
    expect(authCookieOptions(60, 'production')).toMatchObject({
      secure: true,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    });
  });
});
