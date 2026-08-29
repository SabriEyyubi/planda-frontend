import { Link } from '@/lib/i18n/navigation';
import type { ProjectSummary } from '../model/project';
import { CompareToggleButton } from './compare-toggle-button';
import { FavoriteButton } from '@/features/saved/components/favorite-button';
import { getLocale, getTranslations } from 'next-intl/server';

export async function ProjectCard({
  project,
  compact = false,
  selected = false,
}: {
  project: ProjectSummary;
  compact?: boolean;
  selected?: boolean;
}) {
  const locale = await getLocale();
  const t = await getTranslations('ProjectDetail');
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  });
  const delivery = project.deliveryDate
    ? new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'short',
      }).format(new Date(project.deliveryDate))
    : t('ready');
  return (
    <article
      className={`project-card ${compact ? 'project-card--compact' : ''} ${selected ? 'is-selected' : ''}`}
    >
      <Link
        href={`/projects/${project.slug}`}
        className="project-card__media"
        aria-label={t('viewProject', { name: project.name })}
      >
        <span className="project-card__visual" aria-hidden="true" />
        <span className="badge badge--surface">{t('newProject')}</span>
      </Link>
      <div className="project-card__body">
        <div className="project-card__eyebrow">
          <span>{project.district.name}</span>
          <span aria-label={t('stockCurrent')}>● {t('stockCurrent')}</span>
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
            {formatter.format(Number(project.startingPrice))}
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
