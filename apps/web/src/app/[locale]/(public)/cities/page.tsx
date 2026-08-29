import { getCities } from '@/features/catalog/api/public-catalog';
import { CatalogCard } from '@/features/catalog/components/catalog-card';
import { getTranslations } from 'next-intl/server';

export default async function Page() {
  const [cities, t] = await Promise.all([
    getCities(),
    getTranslations('Catalog'),
  ]);
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="page catalog-page container"
    >
      <header className="catalog-heading">
        <span className="eyebrow">{t('discover')}</span>
        <h1>{t('citiesTitle')}</h1>
        <p>{t('citiesDescription')}</p>
      </header>
      {cities.length ? (
        <div className="catalog-grid">
          {cities.map((city) => (
            <CatalogCard
              key={city.id}
              href={`/cities/${city.slug}`}
              name={city.name}
              count={city.publishedProjectCount}
              startingPrice={city.startingPrice}
              currency={city.currency}
            />
          ))}
        </div>
      ) : (
        <CatalogEmpty />
      )}
    </main>
  );
}

async function CatalogEmpty() {
  const t = await getTranslations('Catalog');
  return (
    <section className="empty-state">
      <h2>{t('citiesEmpty')}</h2>
      <p>{t('citiesEmptyDescription')}</p>
    </section>
  );
}
