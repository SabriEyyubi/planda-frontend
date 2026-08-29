'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('Errors');
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main id="main-content" tabIndex={-1} className="page container">
      <section className="card" role="alert">
        <h1>{t('unexpectedTitle')}</h1>
        <p className="muted">{t('unexpectedDescription')}</p>
        <Button type="button" onClick={reset}>
          {t('retry')}
        </Button>
      </section>
    </main>
  );
}
