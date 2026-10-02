import { getCities } from '../api/public-catalog';
import { getProjects } from '@/features/projects/api/projects-adapter';
import { ProjectCard } from '@/features/projects/components/project-card';
import { ProjectFilters } from '@/features/projects/components/project-filters';
import {
  normalizeProjectSearchParams,
  serializeProjectSearchParams,
  type SearchParamValue,
} from '@/features/projects/model/project-query';
import { Link } from '@/lib/i18n/navigation';
import { getTranslations } from 'next-intl/server';

export async function CatalogListing({
  searchParams,
}: {
  searchParams: Record<string, SearchParamValue>;
}) {
  const filters = normalizeProjectSearchParams(searchParams);
  const [t, catalog, cities, { items, pageInfo }] = await Promise.all([
    getTranslations('BuyerCore'),
    getTranslations('OpenCatalog'),
    getCities(),
    getProjects(serializeProjectSearchParams(filters)),
  ]);
  const city = cities.find((item) => item.id === filters.provinceId);
  return (
    <main id="main-content" tabIndex={-1} className="open-catalog">
      <aside className="open-catalog__sidebar" aria-label={t('filters')}>
        <h2>{t('filters')}</h2>
        <ProjectFilters values={filters} cities={cities} />
        <Link className="open-catalog__map" href="/map">
          {t('discoverOnMap')}
        </Link>
      </aside>
      <section
        className="open-catalog__results"
        aria-labelledby="catalog-title"
      >
        <header className="open-catalog__heading">
          <div>
            <p>{t('currentProjectCount', { count: items.length })}</p>
            <h1 id="catalog-title">
              {city ? catalog('cityTitle', { city: city.name }) : t('projects')}
            </h1>
          </div>
        </header>
        {items.length ? (
          <div className="open-catalog__list">
            {items.map((project) => (
              <ProjectCard
                project={project}
                key={project.id}
                variant="catalog"
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h2>{t('noProjects')}</h2>
            <p>{t('noProjectsDescription')}</p>
            <a className="button" href="?">
              {t('clearAll')}
            </a>
          </div>
        )}
        {pageInfo.hasNextPage && pageInfo.nextCursor && (
          <a
            className="button load-more"
            href={`?${serializeProjectSearchParams({ ...filters, cursor: pageInfo.nextCursor })}`}
          >
            {t('loadMore')}
          </a>
        )}
      </section>
    </main>
  );
}
