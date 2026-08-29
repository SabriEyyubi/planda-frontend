import { getProjects } from '@/features/projects/api/projects-adapter';
import { ProjectCard } from '@/features/projects/components/project-card';
import { ProjectFilters } from '@/features/projects/components/project-filters';
import {
  normalizeProjectSearchParams,
  serializeProjectSearchParams,
  type SearchParamValue,
} from '@/features/projects/model/project-query';
import { getTranslations } from 'next-intl/server';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, SearchParamValue>>;
}) {
  const filters = normalizeProjectSearchParams(await searchParams);
  const t = await getTranslations('BuyerCore');
  const { items, pageInfo } = await getProjects(
    serializeProjectSearchParams(filters),
  );
  return (
    <main id="main-content" tabIndex={-1} className="page container">
      <div className="listing-heading">
        <div>
          <span className="eyebrow">{t('listingEyebrow')}</span>
          <h1>{t('projects')}</h1>
          <p>{t('currentProjectCount', { count: items.length })}</p>
        </div>
        <a className="button button--secondary" href="./map">
          {t('discoverOnMap')}
        </a>
      </div>
      <ProjectFilters values={filters} />
      {items.length ? (
        <div className="project-grid">
          {items.map((project) => (
            <ProjectCard project={project} key={project.id} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>{t('noProjects')}</h2>
          <p>{t('noProjectsDescription')}</p>
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
    </main>
  );
}
