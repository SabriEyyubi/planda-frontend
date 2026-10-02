import { describe, expect, it } from 'vitest';
import {
  normalizeProjectSearchParams,
  serializeProjectSearchParams,
} from './project-query';

describe('project query contract', () => {
  it('keeps only supported, non-empty values', () => {
    expect(
      normalizeProjectSearchParams({
        q: ' Başakşehir ',
        roomType: ['2+1', '3+1'],
        bounds: '28,40,29,41',
        unknown: 'ignored',
      }),
    ).toEqual({
      q: 'Başakşehir',
      roomType: '2+1',
      bounds: '28,40,29,41',
    });
  });

  it('serializes values without string interpolation', () => {
    expect(
      serializeProjectSearchParams({ q: 'Vadi & Loft', maxPrice: '10000000' }),
    ).toBe('q=Vadi+%26+Loft&currency=TRY&maxPrice=10000000');
  });

  it.each([
    ['recommended', 'NEWEST'],
    ['freshness_desc', 'NEWEST'],
    ['price_asc', 'PRICE_ASC'],
    ['price_desc', 'PRICE_DESC'],
    ['delivery_asc', 'DELIVERY_ASC'],
  ])('normalizes the legacy %s sort deep link to %s', (legacy, canonical) => {
    expect(normalizeProjectSearchParams({ sort: legacy })).toEqual({
      sort: canonical,
      ...(canonical.startsWith('PRICE_') ? { currency: 'TRY' } : {}),
    });
  });

  it('sends only the backend ProjectSort enum and drops unknown sort values', () => {
    expect(serializeProjectSearchParams({ sort: 'price_asc' })).toBe(
      'currency=TRY&sort=PRICE_ASC',
    );
    expect(normalizeProjectSearchParams({ sort: 'popular' })).toEqual({});
  });

  it('preserves explicit USD for budgets and price sorting', () => {
    expect(
      normalizeProjectSearchParams({
        currency: 'USD',
        maxPrice: '300000',
        sort: 'PRICE_ASC',
      }),
    ).toEqual({ currency: 'USD', maxPrice: '300000', sort: 'PRICE_ASC' });
  });

  it('preserves ready-to-move filtering without forcing a currency', () => {
    expect(serializeProjectSearchParams({ deliveryReady: 'true' })).toBe(
      'deliveryReady=true',
    );
  });
});
