import { getTranslations } from 'next-intl/server';
import { Skeleton } from '@/components/ui/skeleton';

export default async function Loading() {
  const t = await getTranslations('Common');
  return (
    <main id="main-content" tabIndex={-1} className="page container">
      <Skeleton label={t('loading')} />
    </main>
  );
}
