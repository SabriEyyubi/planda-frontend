import { DeveloperSettingsScreen } from '@/features/developer-settings/components/developer-settings-screen';
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
      returnTo="/developer/settings"
    >
      <DeveloperSettingsScreen />
    </ProtectedPage>
  );
}
