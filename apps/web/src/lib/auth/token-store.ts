import 'server-only';
import { cookies } from 'next/headers';
import { authCookieOptions, getAuthCookieNames } from './cookies';

export type BrowserTokens = {
  accessToken: string;
  accessMaxAge: number;
  refreshToken: string;
  refreshMaxAge: number;
};

export async function storeBrowserTokens(tokens: BrowserTokens) {
  const store = await cookies();
  const names = getAuthCookieNames();
  store.set(
    names.access,
    tokens.accessToken,
    authCookieOptions(tokens.accessMaxAge),
  );
  store.set(
    names.refresh,
    tokens.refreshToken,
    authCookieOptions(tokens.refreshMaxAge),
  );
}

export async function clearBrowserTokens() {
  const store = await cookies();
  const names = getAuthCookieNames();
  store.delete(names.access);
  store.delete(names.refresh);
}
