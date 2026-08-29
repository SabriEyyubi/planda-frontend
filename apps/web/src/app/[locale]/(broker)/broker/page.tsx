import { ProtectedPage } from '@/components/shared/protected-page';
import { BrokerProjectScreen } from '@/features/operations/components/broker-operations-screen';

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <ProtectedPage area="broker" locale={locale} returnTo="/broker">
      <BrokerProjectScreen />
    </ProtectedPage>
  );
}
