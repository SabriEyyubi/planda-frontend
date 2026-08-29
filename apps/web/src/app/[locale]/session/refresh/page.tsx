import { SessionRefreshBoundary } from '@/features/auth/components/session-refresh-boundary';
import { safeReturnTo } from '@/lib/auth/return-to';

export default async function SessionRefreshPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  return (
    <SessionRefreshBoundary
      locale={locale}
      returnTo={safeReturnTo(query.returnTo, `/${locale}`)}
    />
  );
}
