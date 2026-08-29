import { describe, expect, it } from 'vitest';
import { parseLeadConsentConfig } from './public';

describe('lead consent public config', () => {
  it('requires a valid public URL and explicit policy version together', () => {
    expect(parseLeadConsentConfig({})).toBeNull();
    expect(parseLeadConsentConfig({ url: '', version: '' })).toBeNull();
    expect(
      parseLeadConsentConfig({ url: 'not-a-url', version: 'kvkk-v1' }),
    ).toBeNull();
    expect(
      parseLeadConsentConfig({
        url: 'javascript:alert(1)',
        version: 'kvkk-v1',
      }),
    ).toBeNull();
    expect(
      parseLeadConsentConfig({
        url: 'https://legal.example.com/lead-consent',
        version: 'lead-consent-2026-08',
      }),
    ).toEqual({
      url: 'https://legal.example.com/lead-consent',
      version: 'lead-consent-2026-08',
    });
  });
});
