import { describe, expect, it } from 'vitest';
import { normalizeApiError } from './errors';

describe('normalizeApiError', () => {
  it('normalizes rate limits', () =>
    expect(normalizeApiError(429).code).toBe('RATE_LIMITED'));
  it('does not expose backend messages', () =>
    expect(normalizeApiError(500).message).toBe('SERVER_ERROR'));
});

it('binds safe lead codes to conflict status only', () => {
  expect(
    normalizeApiError(500, undefined, 'LEAD_CONSENT_VERSION_MISMATCH').code,
  ).toBe('SERVER_ERROR');
  expect(
    normalizeApiError(409, undefined, 'LEAD_CONSENT_VERSION_MISMATCH').code,
  ).toBe('LEAD_CONSENT_VERSION_MISMATCH');
});
