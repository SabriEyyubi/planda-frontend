import type { PropsWithChildren } from 'react';
import { getBrowserSession } from '@/lib/auth/session';
import {
  canAccessArea,
  type ProtectedArea,
} from '@/lib/permissions/permissions';
import { redirect } from '@/lib/i18n/navigation';
import { redirect as redirectInternal } from 'next/navigation';
import { safeReturnTo } from '@/lib/auth/return-to';
import { Forbidden } from './forbidden';
import { authApiAdapter } from '@/features/auth/api/auth-adapter';
import { AuthorizationProvider } from '@/lib/permissions/authorization-context';

type ProtectedPageProps = PropsWithChildren<{
  area: ProtectedArea;
  locale: string;
  returnTo: string;
}>;

export async function ProtectedPage({
  area,
  locale,
  returnTo,
  children,
}: ProtectedPageProps) {
  const session = await getBrowserSession(authApiAdapter);
  if (session.status === 'authenticated') {
    if (!canAccessArea(session.identity, area)) return <Forbidden />;
    return (
      <AuthorizationProvider value={session.identity}>
        {children}
      </AuthorizationProvider>
    );
  } else if (session.status === 'refreshable') {
    const intendedPath = safeReturnTo(`/${locale}${safeReturnTo(returnTo)}`);
    redirectInternal(
      `/${locale}/session/refresh?returnTo=${encodeURIComponent(intendedPath)}`,
    );
    return null;
  } else {
    const intendedPath = safeReturnTo(`/${locale}${safeReturnTo(returnTo)}`);
    redirect({
      href: `/login?returnTo=${encodeURIComponent(intendedPath)}`,
      locale,
    });
    return null;
  }
}
