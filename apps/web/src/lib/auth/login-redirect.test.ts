import { describe, expect, it } from 'vitest';
import { loginUrlForPath } from './login-redirect';

describe('loginUrlForPath', () => {
  it('preserves a locale-scoped internal return path', () => {
    expect(loginUrlForPath('/en/developer/projects')).toBe(
      '/en/login?returnTo=%2Fen%2Fdeveloper%2Fprojects',
    );
  });
  it('preserves the locale and query string for an unauthorized client request', () => {
    expect(loginUrlForPath('/ar/profile', '?tab=contact')).toBe(
      '/ar/login?returnTo=%2Far%2Fprofile%3Ftab%3Dcontact',
    );
  });
  it('falls back safely for unexpected paths', () => {
    expect(loginUrlForPath('//evil.example')).toBe('/tr/login?returnTo=%2F');
  });
});
