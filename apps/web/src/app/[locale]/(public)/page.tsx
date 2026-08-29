import { getProjects } from '@/features/projects/api/projects-adapter';
import { ProjectCard } from '@/features/projects/components/project-card';
import { Link } from '@/lib/i18n/navigation';
import { getTranslations } from 'next-intl/server';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('BuyerCore');
  const { items } = await getProjects();
  return (
    <main id="main-content" tabIndex={-1}>
      <section className="home-hero">
        <div className="home-hero__content container">
          <span className="eyebrow">{t('homeEyebrow')}</span>
          <h1>{t('homeTitle')}</h1>
          <p>{t('homeDescription')}</p>
          <form className="hero-search" action={`/${locale}/projects`}>
            <label>
              <span className="sr-only">{t('searchLabel')}</span>
              <input name="q" placeholder={t('searchPlaceholder')} />
            </label>
            <button className="button" type="submit">
              {t('viewProjects')}
            </button>
          </form>
          <div className="popular-searches">
            <span>{t('popular')}</span>
            <Link href="/projects">İstanbul</Link>
            <Link href="/projects">{t('readyToMove')}</Link>
            <Link href="/projects">≤ ₺10M</Link>
          </div>
        </div>
        <div className="hero-orbit" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </section>
      <section className="home-section container">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{t('selectedProjects')}</span>
            <h2>{t('featuredProjects')}</h2>
          </div>
          <Link href="/projects">{t('allProjects')}</Link>
        </div>
        <div className="project-grid">
          {items.slice(0, 3).map((project) => (
            <ProjectCard project={project} key={project.id} />
          ))}
        </div>
      </section>
      <section className="trust-strip container" aria-label={t('assurances')}>
        <article>
          <strong>{t('verifiedDeveloper')}</strong>
          <span>{t('verifiedDeveloperDescription')}</span>
        </article>
        <article>
          <strong>{t('freshStock')}</strong>
          <span>{t('freshStockDescription')}</span>
        </article>
        <article>
          <strong>{t('transparentPlan')}</strong>
          <span>{t('transparentPlanDescription')}</span>
        </article>
      </section>
    </main>
  );
}
