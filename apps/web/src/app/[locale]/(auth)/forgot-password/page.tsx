import { getTranslations } from 'next-intl/server';
import { AuthForm } from '@/features/auth/components/auth-form';
export default async function Page() {
  const t = await getTranslations('Auth');
  return <AuthForm kind="forgot" title={t('forgotPassword')} />;
}
