import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionRefreshBoundary } from './session-refresh-boundary';

const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

describe('SessionRefreshBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('announces loading, POSTs once, and replaces with a safe return path', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{}')),
    );
    render(<SessionRefreshBoundary locale="en" returnTo="/en/developer" />);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Your session is being refreshed securely',
    );
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith('/api/auth/refresh', {
        method: 'POST',
      }),
    );
    expect(fetch).toHaveBeenCalledOnce();
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith('/en/developer'),
    );
  });

  it('falls back safely to locale login after refresh failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{}', { status: 401 })),
    );
    render(<SessionRefreshBoundary locale="tr" returnTo="https://evil.test" />);
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith('/tr/login?returnTo=%2Ftr'),
    );
  });

  it('keeps the session and offers retry after a 503', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('{}', { status: 503 }))
      .mockResolvedValueOnce(new Response('{}'));
    vi.stubGlobal('fetch', fetchMock);
    render(<SessionRefreshBoundary locale="en" returnTo="/en/developer" />);
    const retry = await screen.findByRole('button', { name: 'Retry' });
    expect(router.replace).not.toHaveBeenCalled();
    retry.click();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith('/en/developer'),
    );
  });
});
