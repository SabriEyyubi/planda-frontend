import { ApiError } from './errors';
import type { BrowserTokens } from '@/lib/auth/token-store';

type AuthRetryDependencies = {
  accessToken?: string;
  refreshToken?: string;
  request: (accessToken: string) => Promise<Response>;
  refresh: (refreshToken: string) => Promise<BrowserTokens | null>;
  rotate: (tokens: BrowserTokens) => Promise<void>;
  clear: () => Promise<void>;
};

export async function requestWithTokenRefresh({
  accessToken,
  refreshToken,
  request,
  refresh,
  rotate,
  clear,
}: AuthRetryDependencies): Promise<Response> {
  if (accessToken) {
    try {
      return await request(accessToken);
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) throw error;
    }
  }

  if (!refreshToken) {
    await clear();
    throw new ApiError('UNAUTHENTICATED', 401);
  }
  const tokens = await refresh(refreshToken);
  if (!tokens) {
    await clear();
    throw new ApiError('UNAUTHENTICATED', 401);
  }
  await rotate(tokens);
  try {
    return await request(tokens.accessToken);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) await clear();
    throw error;
  }
}
