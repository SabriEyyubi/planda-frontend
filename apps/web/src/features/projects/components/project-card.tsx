import { Link } from '@/lib/i18n/navigation';
import type { ProjectSummary } from '../model/project';
import { CompareToggleButton } from './compare-toggle-button';
import { FavoriteButton } from '@/features/saved/components/favorite-button';
import { getLocale, getTranslations } from 'next-intl/server';
import {
  formatProjectDate,
  formatProjectPrice,
  isStockCurrent,
} from '../model/project-presentation';
import { ProjectImage } from './project-image';

export async function ProjectCard({
  project,
  compact = false,
  selected = false,
  variant = 'card',
}: {
  project: ProjectSummary;
  compact?: boolean;
  selected?: boolean;
  variant?: 'card' | 'catalog';
}) {
  const locale = await getLocale();
  const t = await getTranslations('ProjectDetail');
  const catalog = await getTranslations('OpenCatalog');
  const delivery = formatProjectDate(project.deliveryDate, locale);
  const stockLabel = isStockCurrent(project.stockUpdatedAt)
    ? t('stockCurrent')
    : t('freshnessPending');
  if (variant === 'catalog')
    return (
      <article className="catalog-project">
        <Link
          href={`/projects/${project.slug}`}
          className="catalog-project__media"
          aria-label={t('viewProject', { name: project.name })}
        >
          <ProjectImage
            url={project.heroImageUrl}
            fallback={t('imagePending')}
          />
        </Link>
        <div className="catalog-project__body">
          <h2>
            <Link href={`/projects/${project.slug}`}>{project.name}</Link>
          </h2>
          <p className="catalog-project__location">
            {project.province.name} / {project.district.name}
          </p>
          <dl className="catalog-project__facts">
            <div>
              <dt>{catalog('price')}</dt>
              <dd>
                <strong>
                  {formatProjectPrice(
                    project.startingPrice,
                    project.currency,
                    locale,
                  )}
                </strong>{' '}
                <small>{t('from')}</small>
              </dd>
            </div>
            <div>
              <dt>{catalog('developer')}</dt>
              <dd>{project.developerName}</dd>
            </div>
            <div>
              <dt>{catalog('delivery')}</dt>
              <dd>
                {project.deliveryDate ? delivery : catalog('unspecified')}
              </dd>
            </div>
          </dl>
          {project.summary && (
            <p className="catalog-project__summary">{project.summary}</p>
          )}
          <div className="catalog-project__footer">
            <Link className="button" href={`/projects/${project.slug}`}>
              {catalog('viewProject')} <span aria-hidden="true">→</span>
            </Link>
            <div className="project-card__actions">
              <FavoriteButton projectId={project.id} />
              <CompareToggleButton projectId={project.id} />
            </div>
          </div>
        </div>
      </article>
    );
  return (
    <article
      className={`project-card ${compact ? 'project-card--compact' : ''} ${selected ? 'is-selected' : ''}`}
    >
      <Link
        href={`/projects/${project.slug}`}
        className="project-card__media"
        aria-label={t('viewProject', { name: project.name })}
      >
        <ProjectImage url={project.heroImageUrl} fallback={t('imagePending')} />
        <span className="badge badge--surface">{t('newProject')}</span>
      </Link>
      <div className="project-card__body">
        <div className="project-card__eyebrow">
          <span>{project.district.name}</span>
          <span>{stockLabel}</span>
        </div>
        <h3>
          <Link href={`/projects/${project.slug}`}>{project.name}</Link>
        </h3>
        <p>
          {project.developerName}{' '}
          {project.developerVerified && (
            <span className="verified">✓ {t('verified')}</span>
          )}
        </p>
        <div className="project-card__facts">
          <strong>
            {formatProjectPrice(
              project.startingPrice,
              project.currency,
              locale,
            )}
            <small>{t('from')}</small>
          </strong>
          <span>{delivery}</span>
        </div>
        <div className="project-card__actions">
          <FavoriteButton projectId={project.id} />
          <CompareToggleButton projectId={project.id} />
        </div>
      </div>
    </article>
  );
}
