import type { PropsWithChildren } from 'react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';

export async function AuthLayout({ children }: PropsWithChildren) {
  const t = await getTranslations('Auth');
  return (
    <main id="main-content" tabIndex={-1} className="auth-page">
      <section className="auth-panel">
        <Link className="brand" href="/">
          PLANDA<span>.</span>
        </Link>
        <div className="auth-card">{children}</div>
      </section>
      <aside className="auth-visual" aria-label={t('visualLabel')}>
        <div>
          <strong>{t('visualTitle')}</strong>
          <p>{t('visualDescription')}</p>
        </div>
      </aside>
    </main>
  );
}
