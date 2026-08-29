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
