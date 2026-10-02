import { describe, expect, it, vi } from 'vitest';
import { allOperationItems, type operationsRequest } from './operations-client';

describe('authorized project pagination', () => {
  it('follows encoded cursors and deduplicates boundary rows', async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce({
        items: [{ id: 'a' }],
        pageInfo: { hasNextPage: true, nextCursor: 'next/+' },
      })
      .mockResolvedValueOnce({
        items: [{ id: 'a' }, { id: 'b' }],
        pageInfo: { hasNextPage: false, nextCursor: null },
      });
    expect(
      await allOperationItems(
        '/developer/projects',
        request as typeof operationsRequest,
      ),
    ).toEqual([{ id: 'a' }, { id: 'b' }]);
    expect(request).toHaveBeenLastCalledWith(
      '/developer/projects?cursor=next%2F%2B',
    );
  });
  it('fails explicitly on a repeated cursor rather than looping or hiding records', async () => {
    const request = vi
      .fn()
      .mockResolvedValue({
        items: [],
        pageInfo: { hasNextPage: true, nextCursor: 'same' },
      });
    await expect(
      allOperationItems(
        '/broker/projects',
        request as typeof operationsRequest,
      ),
    ).rejects.toThrow('INVALID_PAGINATION_CURSOR');
    expect(request).toHaveBeenCalledTimes(2);
  });
});
