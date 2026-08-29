import { describe, expect, it } from 'vitest';
import { normalizeApiError } from './errors';

describe('normalizeApiError', () => {
  it('normalizes rate limits', () =>
    expect(normalizeApiError(429).code).toBe('RATE_LIMITED'));
  it('does not expose backend messages', () =>
    expect(normalizeApiError(500).message).toBe('SERVER_ERROR'));
});
