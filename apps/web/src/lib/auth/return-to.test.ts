import { describe, expect, it } from 'vitest';
import { safeReturnTo } from './return-to';

describe('safeReturnTo', () => {
  it('accepts an internal path', () =>
    expect(safeReturnTo('/profile?tab=security')).toBe(
      '/profile?tab=security',
    ));
  it.each(['https://evil.example', '//evil.example', undefined])(
    'rejects unsafe value %s',
    (value) => {
      expect(safeReturnTo(value)).toBe('/');
    },
  );
});
