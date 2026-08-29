import 'server-only';
import type { BrowserTokens } from '@/lib/auth/token-store';
import type { SessionIdentity, SessionVerifier } from '@/lib/auth/session';
import { serverApiRequest } from '@/lib/api/server';
import { ApiError } from '@/lib/api/errors';

export interface AuthApiAdapter extends SessionVerifier {
  readonly contractAvailable: boolean;
  refreshSession(refreshToken: string): Promise<BrowserTokens | null>;
  revokeSession(refreshToken: string): Promise<void>;
}

export const authApiAdapter: AuthApiAdapter = {
  contractAvailable: true,
  async verifyAccessToken(accessToken): Promise<SessionIdentity | null> {
    try {
      const response = await serverApiRequest('/auth/me', { accessToken });
      const user = (await response.json()) as {
        id: string;
        email: string;
        roles: NonNullable<SessionIdentity['platformRoles']>;
        organizationMemberships?: NonNullable<
          SessionIdentity['organizationMemberships']
        >;
      };
      const priority: NonNullable<SessionIdentity['platformRole']>[] = [
        'SUPER_ADMIN',
        'ADMIN',
        'DEVELOPER_MEMBER',
        'BROKER',
        'BUYER',
      ];
      const platformRole = priority.find((role) => user.roles.includes(role));
      return platformRole
        ? {
            subject: user.id,
            email: user.email,
            platformRole,
            platformRoles: user.roles,
            organizationMemberships: user.organizationMemberships ?? [],
            organizationRoles: (user.organizationMemberships ?? []).map(
              ({ role }) => role,
            ),
          }
        : null;
    } catch {
      return null;
    }
  },
  async refreshSession(refreshToken) {
    try {
      const response = await serverApiRequest('/auth/refresh', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const tokens = (await response.json()) as {
        accessToken: string;
        refreshToken: string;
        accessTokenExpiresIn: number;
        refreshTokenExpiresIn: number;
      };
      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        accessMaxAge: tokens.accessTokenExpiresIn,
        refreshMaxAge: tokens.refreshTokenExpiresIn,
      };
    } catch (error) {
      if (error instanceof ApiError && (error.status ?? 0) >= 500) {
        throw new ApiError(
          error.status === 503
            ? 'AUTH_REFRESH_COORDINATION_UNAVAILABLE'
            : error.code,
          error.status,
          error.requestId,
        );
      }
      return null;
    }
  },
  async revokeSession(refreshToken) {
    await serverApiRequest('/auth/logout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
  },
};
