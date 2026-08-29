import { getDeveloper } from '@/features/catalog/api/public-catalog';
import { getProjects } from '@/features/projects/api/projects-adapter';
import { ProjectCard } from '@/features/projects/components/project-card';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const developer = await getDeveloper(slug);
  if (!developer) notFound();
  const [projects, t] = await Promise.all([
    getProjects(
      new URLSearchParams({
        developerOrganizationId: developer.id,
        limit: '100',
      }).toString(),
    ),
    getTranslations('Catalog'),
  ]);
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="page catalog-page container"
    >
      <header className="developer-detail-heading">
        <span className="catalog-logo" aria-hidden="true">
          {developer.name.slice(0, 2).toUpperCase()}
        </span>
        <div>
          <span className="eyebrow">{t('developer')}</span>
          <h1>{developer.name}</h1>
          {developer.verifiedAt && (
            <span className="verified">✓ {t('verified')}</span>
          )}
          <p>{developer.about || t('developerAboutPending')}</p>
        </div>
      </header>
      <section>
        <div className="section-heading">
          <div>
            <span className="eyebrow">{t('publishedProjects')}</span>
            <h2>{t('developerProjects', { count: projects.items.length })}</h2>
          </div>
        </div>
        {projects.items.length ? (
          <div className="project-grid">
            {projects.items.map((project) => (
              <ProjectCard project={project} key={project.id} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>{t('projectsEmpty')}</h3>
            <p>{t('projectsEmptyDescription')}</p>
          </div>
        )}
      </section>
    </main>
  );
}
