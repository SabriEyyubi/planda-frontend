import { describe, expect, it } from 'vitest';
import { quickSearchLinks } from './quick-search';
import {
  normalizeProjectSearchParams,
  serializeProjectSearchParams,
} from './project-query';

describe('homepage quick searches', () => {
  it('routes Istanbul to its filtered city catalog', () => {
    expect(quickSearchLinks.istanbul).toBe('/cities/istanbul');
  });
  it.each([
    [quickSearchLinks.ready, { deliveryReady: 'true' }],
    [quickSearchLinks.budget, { maxPrice: '10000000', currency: 'TRY' }],
  ])('retains backend-supported filters for %s', (href, expected) => {
    const params = new URL(href, 'http://localhost').searchParams;
    const outgoing = serializeProjectSearchParams(
      normalizeProjectSearchParams(Object.fromEntries(params)),
    );
    expect(Object.fromEntries(new URLSearchParams(outgoing))).toEqual(expected);
  });
});
