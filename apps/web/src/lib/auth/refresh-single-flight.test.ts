import { describe, expect, it, vi } from 'vitest';
import { refreshSingleFlight } from './refresh-single-flight';

describe('refreshSingleFlight', () => {
  it('shares one rotating refresh request for parallel callers', async () => {
    let resolve!: (value: {
      accessToken: string;
      refreshToken: string;
      accessMaxAge: number;
      refreshMaxAge: number;
    }) => void;
    const refresh = vi.fn(
      () =>
        new Promise<Parameters<typeof resolve>[0]>((done) => {
          resolve = done;
        }),
    );
    const first = refreshSingleFlight('same-session-token', refresh);
    const second = refreshSingleFlight('same-session-token', refresh);
    expect(refresh).toHaveBeenCalledOnce();
    resolve({
      accessToken: 'rotated-access',
      refreshToken: 'rotated-refresh',
      accessMaxAge: 900,
      refreshMaxAge: 2_592_000,
    });
    await expect(Promise.all([first, second])).resolves.toEqual([
      expect.objectContaining({ refreshToken: 'rotated-refresh' }),
      expect.objectContaining({ refreshToken: 'rotated-refresh' }),
    ]);
  });
});
