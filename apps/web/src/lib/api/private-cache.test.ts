import { describe, expect, it } from 'vitest';
import { applyPrivateNoStore, PRIVATE_CACHE_CONTROL } from './private-cache';

describe('private BFF caching', () => {
  it('marks responses private and non-cacheable, including GET payloads', () => {
    const response = applyPrivateNoStore(new Response('{}'));
    expect(response.headers.get('cache-control')).toBe(PRIVATE_CACHE_CONTROL);
  });
});
