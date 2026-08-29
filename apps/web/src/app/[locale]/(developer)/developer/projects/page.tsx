import { ProtectedPage } from '@/components/shared/protected-page';
import { DeveloperOperationsScreen } from '@/features/operations/components/developer-operations-screen';

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
      returnTo="/developer/projects"
    >
      <DeveloperOperationsScreen view="projects" />
    </ProtectedPage>
  );
}
