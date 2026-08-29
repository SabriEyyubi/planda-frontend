import { describe, expect, it } from 'vitest';
import { isSameOriginRequest } from './csrf';

describe('isSameOriginRequest', () => {
  it('accepts a matching browser origin and host', () => {
    const headers = new Headers({
      origin: 'https://planda.com',
      host: 'planda.com',
    });
    expect(isSameOriginRequest(headers)).toBe(true);
  });

  it('does not trust client-supplied forwarded host headers', () => {
    const headers = new Headers({
      origin: 'https://evil.test',
      host: 'planda.com',
      'x-forwarded-host': 'evil.test',
      'x-forwarded-proto': 'https',
    });
    expect(isSameOriginRequest(headers)).toBe(false);
  });

  it('rejects cross-origin and missing origins', () => {
    expect(
      isSameOriginRequest(
        new Headers({ origin: 'https://evil.test', host: 'planda.com' }),
      ),
    ).toBe(false);
    expect(isSameOriginRequest(new Headers({ host: 'planda.com' }))).toBe(
      false,
    );
  });
});
