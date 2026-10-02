import { describe, expect, it } from 'vitest';
import {
  formatProjectDate,
  formatProjectPrice,
  isStockCurrent,
} from './project-presentation';

describe('truthful project facts', () => {
  it('formats TRY and USD without currency conversion', () => {
    expect(formatProjectPrice('300000', 'USD', 'en')).toBe('$300,000');
    expect(formatProjectPrice('10000000', 'TRY', 'en')).toContain('10,000,000');
    expect(formatProjectPrice('10000000', 'TRY', 'en')).not.toContain('$');
  });
  it('does not claim readiness when a delivery date is unknown', () => {
    expect(formatProjectDate(null, 'tr')).toBe('—');
    expect(formatProjectDate('invalid', 'tr')).toBe('—');
    expect(formatProjectDate('2027-12-01T00:00:00Z', 'en')).toContain('2027');
  });
  it('only labels known, nonfuture stock within 48 hours current', () => {
    const now = Date.parse('2026-09-20T12:00:00Z');
    expect(isStockCurrent('2026-09-19T12:00:00Z', now)).toBe(true);
    expect(isStockCurrent('2026-09-18T12:00:00Z', now)).toBe(true);
    expect(isStockCurrent('2026-09-18T11:59:59Z', now)).toBe(false);
    expect(isStockCurrent('2026-09-21T12:00:00Z', now)).toBe(false);
    expect(isStockCurrent(null, now)).toBe(false);
    expect(isStockCurrent('invalid', now)).toBe(false);
  });
});
