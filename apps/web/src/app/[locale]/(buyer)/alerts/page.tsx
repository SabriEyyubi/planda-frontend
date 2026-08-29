import { PolicyUnavailable } from '@/components/shared/policy-unavailable';
import { ProtectedPage } from '@/components/shared/protected-page';

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <ProtectedPage area="buyer" locale={locale} returnTo="/alerts">
      <PolicyUnavailable surface="buyerAlerts" href="/saved" />
    </ProtectedPage>
  );
}
