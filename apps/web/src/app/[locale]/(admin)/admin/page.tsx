import { ProtectedPage } from '@/components/shared/protected-page';
import { AdminOperationsScreen } from '@/features/operations/components/admin-operations-screen';

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <ProtectedPage area="admin" locale={locale} returnTo="/admin">
      <AdminOperationsScreen />
    </ProtectedPage>
  );
}
