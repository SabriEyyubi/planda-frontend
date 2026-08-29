import { ProtectedPage } from '@/components/shared/protected-page';
import { BrokerContactsScreen } from '@/features/broker/components/broker-growth-screens';

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <ProtectedPage area="broker" locale={locale} returnTo="/broker/contacts">
      <BrokerContactsScreen />
    </ProtectedPage>
  );
}
