import { getTranslations } from 'next-intl/server';

export default async function NotFound() {
  const t = await getTranslations('Errors');
  return (
    <main id="main-content" tabIndex={-1} className="page container">
      <section className="card">
        <h1>{t('notFoundTitle')}</h1>
        <p className="muted">{t('notFoundDescription')}</p>
      </section>
    </main>
  );
}
