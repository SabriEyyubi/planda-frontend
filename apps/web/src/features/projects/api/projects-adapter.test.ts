import { afterEach, describe, expect, it, vi } from 'vitest';

const serverApiRequest = vi.fn();

vi.mock('server-only', () => ({}));
vi.mock('@/lib/api/server', () => ({ serverApiRequest }));

describe('projects adapter data source isolation', () => {
  afterEach(() => {
    delete process.env.USE_MOCK_DATA;
    serverApiRequest.mockReset();
    vi.resetModules();
  });

  it('uses fixtures only when the explicit server flag is true', async () => {
    process.env.USE_MOCK_DATA = 'true';
    const { getProject, getProjects } = await import('./projects-adapter');

    await expect(getProjects()).resolves.toMatchObject({
      items: expect.arrayContaining([
        expect.objectContaining({ slug: 'nova-basaksehir' }),
      ]),
    });
    await expect(getProject('unknown-project')).resolves.toBeNull();
    expect(serverApiRequest).not.toHaveBeenCalled();
  });

  it('returns real backend data in development without mixing fixtures', async () => {
    serverApiRequest.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          items: [{ id: 'real-project', slug: 'seed-bosphorus' }],
          pageInfo: { hasNextPage: false, nextCursor: null },
        }),
      ),
    );
    const { getProjects } = await import('./projects-adapter');

    await expect(getProjects()).resolves.toMatchObject({
      items: [{ id: 'real-project', slug: 'seed-bosphorus' }],
    });
  });

  it('maps only a real backend 404 to a missing detail', async () => {
    const { ApiError } = await import('@/lib/api/errors');
    serverApiRequest.mockRejectedValueOnce(new ApiError('NOT_FOUND', 404));
    const { getProject } = await import('./projects-adapter');

    await expect(getProject('missing')).resolves.toBeNull();
  });

  it('propagates backend failures instead of showing fixture data', async () => {
    const { ApiError } = await import('@/lib/api/errors');
    const failure = new ApiError('SERVER_ERROR', 503, 'request-id');
    serverApiRequest.mockRejectedValueOnce(failure);
    const { getProjects } = await import('./projects-adapter');

    await expect(getProjects()).rejects.toBe(failure);
  });
});
