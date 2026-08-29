import 'server-only';
import { cookies } from 'next/headers';
import type { PermissionSubject } from '@/lib/permissions/permissions';
import { getAuthCookieNames } from './cookies';

export type SessionIdentity = PermissionSubject & {
  subject: string;
  email?: string;
};

export type BrowserSession =
  | { status: 'anonymous' }
  | { status: 'refreshable' }
  | { status: 'unverified' }
  | { status: 'authenticated'; identity: SessionIdentity };

export interface SessionVerifier {
  verifyAccessToken(token: string): Promise<SessionIdentity | null>;
}

const pendingVerifier: SessionVerifier = {
  async verifyAccessToken() {
    return null;
  },
};

export async function getBrowserSession(
  verifier: SessionVerifier = pendingVerifier,
): Promise<BrowserSession> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(getAuthCookieNames().access)?.value;
  const refreshToken = cookieStore.get(getAuthCookieNames().refresh)?.value;
  if (!accessToken)
    return refreshToken ? { status: 'refreshable' } : { status: 'anonymous' };

  const identity = await verifier.verifyAccessToken(accessToken);
  return identity
    ? { status: 'authenticated', identity }
    : refreshToken
      ? { status: 'refreshable' }
      : { status: 'unverified' };
}
