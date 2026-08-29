import { ProfileScreen } from '@/features/profile/components/profile-screen';
import { ProtectedPage } from '@/components/shared/protected-page';

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <ProtectedPage area="buyer" locale={locale} returnTo="/profile">
      <ProfileScreen />
    </ProtectedPage>
  );
}
