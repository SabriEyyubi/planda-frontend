import { ProtectedPage } from '@/components/shared/protected-page';
import { BrokerMaterialsScreen } from '@/features/operations/components/broker-operations-screen';

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <ProtectedPage area="broker" locale={locale} returnTo="/broker/materials">
      <BrokerMaterialsScreen />
    </ProtectedPage>
  );
}
