import { describe, expect, it } from 'vitest';
import { getTextDirection, routing } from './routing';

describe('locale routing', () => {
  it('defaults to Turkish without browser detection', () => {
    expect(routing.defaultLocale).toBe('tr');
    expect(routing.localeDetection).toBe(false);
  });
  it('uses RTL only for Arabic', () => {
    expect(getTextDirection('ar')).toBe('rtl');
    expect(getTextDirection('tr')).toBe('ltr');
  });
});
