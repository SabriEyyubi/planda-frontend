'use client';

import { useCallback, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import type { LngLatBounds } from 'maplibre-gl';
import { Link } from '@/lib/i18n/navigation';
import type { ProjectSummary } from '../model/project';
import { InteractiveProjectMap } from './interactive-project-map';
import { ProjectFilters } from './project-filters';
import type { ProjectSearchParams } from '../model/project-query';

export function MapDiscovery({
  projects,
  filters,
}: {
  projects: ProjectSummary[];
  filters: ProjectSearchParams;
}) {
  const t = useTranslations('MapDiscovery');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const resultRefs = useRef(new Map<string, HTMLButtonElement>());
  const [selectedId, setSelectedId] = useState(projects[0]?.id);
  const [pendingBounds, setPendingBounds] = useState<LngLatBounds>();
  const [mobileMode, setMobileMode] = useState<'list' | 'map'>('map');
  const activeSelectedId = projects.some((project) => project.id === selectedId)
    ? selectedId
    : projects[0]?.id;
  const selected = projects.find((project) => project.id === activeSelectedId);
  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    resultRefs.current
      .get(id)
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, []);

  function applyBounds() {
    if (!pendingBounds) return;
    const value = [
      pendingBounds.getWest(),
      pendingBounds.getSouth(),
      pendingBounds.getEast(),
      pendingBounds.getNorth(),
    ]
      .map((number) => number.toFixed(5))
      .join(',');
    const query = new URLSearchParams(window.location.search);
    query.set('bounds', value);
    query.delete('cursor');
    setPendingBounds(undefined);
    router.replace(`${pathname}?${query.toString()}`);
  }

  return (
    <section className="discovery">
      <header className="map-page-heading">
        <h1>{t('title')}</h1>
        <p>{t('description')}</p>
      </header>
      <div className="discovery__toolbar">
        <ProjectFilters values={filters} compact />
        <div
          className="map-mobile-switch"
          role="group"
          aria-label={t('viewMode')}
        >
          <button
            type="button"
            aria-pressed={mobileMode === 'map'}
            onClick={() => setMobileMode('map')}
          >
            {t('map')}
          </button>
          <button
            type="button"
            aria-pressed={mobileMode === 'list'}
            onClick={() => setMobileMode('list')}
          >
            {t('list')}
          </button>
        </div>
      </div>
      <div className={`discovery__content mobile-mode-${mobileMode}`}>
        <div className="discovery__results" aria-label={t('results')}>
          <div className="results-heading">
            <strong>{t('projectCount', { count: projects.length })}</strong>
            <span>{sortLabel(filters.sort, t)}</span>
          </div>
          {projects.length === 0 ? (
            <div className="empty-state">
              <h2>{t('empty')}</h2>
              <p>{t('emptyDescription')}</p>
              <button
                className="button"
                onClick={() => router.replace(pathname)}
              >
                {t('clearFilters')}
              </button>
            </div>
          ) : (
            projects.map((project) => {
              const formatter = new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: project.currency,
                notation: 'compact',
                maximumFractionDigits: 1,
              });
              return (
                <button
                  type="button"
                  key={project.id}
                  ref={(element) => {
                    if (element) resultRefs.current.set(project.id, element);
                    else resultRefs.current.delete(project.id);
                  }}
                  className={`map-result ${project.id === activeSelectedId ? 'is-selected' : ''}`}
                  onClick={() => handleSelect(project.id)}
                  aria-pressed={project.id === activeSelectedId}
                >
                  <span
                    className="map-result__visual"
                    aria-hidden="true"
                    style={
                      project.heroImageUrl
                        ? { backgroundImage: `url(${project.heroImageUrl})` }
                        : undefined
                    }
                  />
                  <span>
                    <strong>{project.name}</strong>
                    <small>
                      {project.district.name} · {project.developerName}
                    </small>
                    <b>
                      {t('startingFrom', {
                        price: formatter.format(Number(project.startingPrice)),
                      })}
                    </b>
                  </span>
                </button>
              );
            })
          )}
        </div>
        <div className="discovery__map">
          <InteractiveProjectMap
            projects={projects}
            selectedId={activeSelectedId}
            onSelect={handleSelect}
            onBoundsChange={setPendingBounds}
          />
          <button
            className="map-search-area"
            type="button"
            onClick={applyBounds}
            disabled={!pendingBounds}
          >
            {t('searchArea')}
          </button>
          {selected && (
            <Link className="map-preview" href={`/projects/${selected.slug}`}>
              <span
                className="map-preview__visual"
                aria-hidden="true"
                style={
                  selected.heroImageUrl
                    ? { backgroundImage: `url(${selected.heroImageUrl})` }
                    : undefined
                }
              />
              <span>
                <strong>{selected.name}</strong>
                <small>{selected.district.name}</small>
                <b>{t('viewProject')} →</b>
              </span>
            </Link>
          )}
          <p className="sr-only" aria-live="polite" aria-atomic="true">
            {selected ? t('selectedProject', { name: selected.name }) : ''}
          </p>
        </div>
      </div>
    </section>
  );
}

function sortLabel(
  sort: string | undefined,
  t: ReturnType<typeof useTranslations<'MapDiscovery'>>,
) {
  if (sort === 'PRICE_ASC') return t('priceAsc');
  if (sort === 'PRICE_DESC') return t('priceDesc');
  if (sort === 'DELIVERY_ASC') return t('deliveryAsc');
  return t('newest');
}
