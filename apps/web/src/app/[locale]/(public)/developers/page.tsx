import { getDevelopers } from '@/features/catalog/api/public-catalog';
import { CatalogCard } from '@/features/catalog/components/catalog-card';
import { getTranslations } from 'next-intl/server';

export default async function Page() {
  const [developers, t] = await Promise.all([
    getDevelopers(),
    getTranslations('Catalog'),
  ]);
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="page catalog-page container"
    >
      <header className="catalog-heading">
        <span className="eyebrow">{t('trustedSupply')}</span>
        <h1>{t('developersTitle')}</h1>
        <p>{t('developersDescription')}</p>
      </header>
      {developers.length ? (
        <div className="catalog-grid">
          {developers.map((developer) => (
            <CatalogCard
              key={developer.id}
              href={`/developers/${developer.slug}`}
              name={developer.name}
              count={developer.publishedProjectCount}
              startingPrice={developer.startingPrice}
              currency={developer.currency}
              verified={Boolean(developer.verifiedAt)}
            />
          ))}
        </div>
      ) : (
        <section className="empty-state">
          <h2>{t('developersEmpty')}</h2>
          <p>{t('developersEmptyDescription')}</p>
        </section>
      )}
    </main>
  );
}
