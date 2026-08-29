import { DeveloperAnalyticsScreen } from '@/features/analytics/components/developer-analytics-screen';
import { ProtectedPage } from '@/components/shared/protected-page';

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <ProtectedPage
      area="developer"
      locale={locale}
      returnTo="/developer/analytics"
    >
      <DeveloperAnalyticsScreen />
    </ProtectedPage>
  );
}
