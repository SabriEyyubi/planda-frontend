import { describe, expect, it } from 'vitest';
import {
  MAX_COMPARE_PROJECTS,
  normalizeCompareIds,
  readCompareIds,
  toggleCompareId,
} from './compare-storage';

describe('compare storage', () => {
  it('deduplicates and caps the design selection at four', () => {
    expect(normalizeCompareIds(['a', 'a', 'b', 'c', 'd', 'e'])).toEqual([
      'a',
      'b',
      'c',
      'd',
    ]);
    expect(MAX_COMPARE_PROJECTS).toBe(4);
  });

  it('does not evict an existing item when the limit is reached', () => {
    expect(toggleCompareId(['a', 'b', 'c', 'd'], 'e')).toEqual([
      'a',
      'b',
      'c',
      'd',
    ]);
  });

  it('recovers safely from malformed browser storage', () => {
    expect(readCompareIds('{invalid')).toEqual([]);
  });
});
