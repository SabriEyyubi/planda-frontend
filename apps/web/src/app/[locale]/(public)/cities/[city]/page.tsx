import { getCity } from '@/features/catalog/api/public-catalog';
import { getProjects } from '@/features/projects/api/projects-adapter';
import { ProjectCard } from '@/features/projects/components/project-card';
import { Link } from '@/lib/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

export default async function Page({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city: slug } = await params;
  const city = await getCity(slug);
  if (!city) notFound();
  const [projects, t] = await Promise.all([
    getProjects(
      new URLSearchParams({ provinceId: city.id, limit: '100' }).toString(),
    ),
    getTranslations('Catalog'),
  ]);
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="page catalog-page container"
    >
      <header className="catalog-detail-heading">
        <div>
          <span className="eyebrow">{t('city')}</span>
          <h1>{city.name}</h1>
          <p>{t('cityProjectCount', { count: city.publishedProjectCount })}</p>
        </div>
        <Link
          className="button button--secondary"
          href={`/map?provinceId=${encodeURIComponent(city.id)}`}
        >
          {t('viewOnMap')}
        </Link>
      </header>
      {projects.items.length ? (
        <div className="project-grid">
          {projects.items.map((project) => (
            <ProjectCard project={project} key={project.id} />
          ))}
        </div>
      ) : (
        <section className="empty-state">
          <h2>{t('projectsEmpty')}</h2>
          <p>{t('projectsEmptyDescription')}</p>
        </section>
      )}
    </main>
  );
}
