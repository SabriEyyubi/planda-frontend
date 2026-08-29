import { ProtectedPage } from '@/components/shared/protected-page';
import { SavedProjectsScreen } from '@/features/saved/components/saved-projects-screen';

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <ProtectedPage area="buyer" locale={locale} returnTo="/saved">
      <SavedProjectsScreen />
    </ProtectedPage>
  );
}
