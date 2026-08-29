import type { BrowserTokens } from './token-store';

const pendingRefreshes = new Map<string, Promise<BrowserTokens | null>>();

export function refreshSingleFlight(
  refreshToken: string,
  refresh: (token: string) => Promise<BrowserTokens | null>,
) {
  const existing = pendingRefreshes.get(refreshToken);
  if (existing) return existing;
  const pending = refresh(refreshToken).finally(() => {
    if (pendingRefreshes.get(refreshToken) === pending)
      pendingRefreshes.delete(refreshToken);
  });
  pendingRefreshes.set(refreshToken, pending);
  return pending;
}
