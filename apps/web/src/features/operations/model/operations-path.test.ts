import { describe, expect, it } from 'vitest';
import { allowedOperationsPath } from './operations-path';

describe('operations BFF allowlist', () => {
  it('accepts contracted read and mutation paths', () => {
    expect(allowedOperationsPath('GET', 'developer', ['overview'])).toBe(
      '/developer/overview',
    );
    expect(
      allowedOperationsPath('PATCH', 'admin', ['projects', 'p-1', 'status']),
    ).toBe('/admin/projects/p-1/status');
  });

  it('rejects traversal, unknown areas and unapproved mutations', () => {
    expect(
      allowedOperationsPath('GET', 'developer', ['..', 'admin']),
    ).toBeNull();
    expect(
      allowedOperationsPath('DELETE', 'broker', ['projects', 'p-1']),
    ).toBeNull();
    expect(allowedOperationsPath('GET', 'identity', ['users'])).toBeNull();
  });

  it('allows approved growth operations without widening identifiers', () => {
    expect(allowedOperationsPath('GET', 'developer', ['analytics'])).toBe(
      '/developer/analytics',
    );
    expect(allowedOperationsPath('GET', 'developer', ['organizations'])).toBe(
      '/developer/organizations',
    );
    expect(allowedOperationsPath('POST', 'broker', ['clients'])).toBe(
      '/broker/clients',
    );
    expect(
      allowedOperationsPath('PUT', 'developer', [
        'projects',
        'project-1',
        'media',
        'reorder',
      ]),
    ).toBe('/developer/projects/project-1/media/reorder');
    expect(
      allowedOperationsPath('DELETE', 'developer', [
        'projects',
        '../foreign',
        'media',
        'media-1',
      ]),
    ).toBeNull();
  });
});
