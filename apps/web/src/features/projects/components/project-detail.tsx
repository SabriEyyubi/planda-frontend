/* eslint-disable @next/next/no-img-element */
import type {
  ProjectDetail as ProjectDetailModel,
  ProjectMedia,
} from '../model/project';
import { LeadDialog } from '@/features/leads/components/lead-dialog';
import { FavoriteButton } from '@/features/saved/components/favorite-button';
import { CompareToggleButton } from './compare-toggle-button';
import { ShareProjectButton } from './share-project-button';
import { PaymentPlanSheet } from './payment-plan-sheet';
import { MobileProjectCta } from './mobile-project-cta';
import { getLocale, getTranslations } from 'next-intl/server';
import { ProjectViewTracker } from './project-view-tracker';

const money = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  maximumFractionDigits: 0,
});

export async function ProjectDetail({
  project,
}: {
  project: ProjectDetailModel;
}) {
  const t = await getTranslations('ProjectDetail');
  const locale = await getLocale();
  const delivery = project.deliveryDate
    ? new Intl.DateTimeFormat('tr-TR', {
        year: 'numeric',
        month: 'long',
      }).format(new Date(project.deliveryDate))
    : t('ready');
  const freshness = latestFreshness(
    project.stockUpdatedAt,
    project.priceUpdatedAt,
    locale,
    t('freshnessPending'),
  );
  return (
    <main id="main-content" tabIndex={-1} className="project-detail">
      <ProjectViewTracker projectId={project.id} />
      <div className="breadcrumbs container">
        İstanbul / {project.district.name} / {project.name}
      </div>
      <ProjectGallery
        project={project}
        label={t('gallery')}
        allPhotos={t('allPhotos')}
        imagePending={t('imagePending')}
      />
      <div className="project-hero container">
        <section>
          <div className="badge-row">
            <span className="badge">{t('construction')}</span>
            <span className="badge badge--success">● {freshness}</span>
          </div>
          <h1>{project.name}</h1>
          <p className="project-location">
            {project.district.name}, {project.province.name}
          </p>
          <p>
            {project.developerName}{' '}
            {project.developerVerified && (
              <span className="verified">✓ {t('verifiedDeveloper')}</span>
            )}
          </p>
          <nav className="section-nav" aria-label={t('content')}>
            <a href="#overview">{t('overview')}</a>
            <a href="#units">{t('units')}</a>
            <a href="#plans">{t('paymentPlans')}</a>
            <a href="#location">{t('locationNav')}</a>
          </nav>
          <p id="overview" className="project-summary">
            {project.summary}
          </p>
        </section>
        <aside className="project-action-card">
          <span>{t('startingPrice')}</span>
          <strong>{money.format(Number(project.startingPrice))}</strong>
          <dl>
            <div>
              <dt>{t('unitTypes')}</dt>
              <dd>
                {project.unitTypes.map((unit) => unit.roomType).join(' – ')}
              </dd>
            </div>
            <div>
              <dt>{t('delivery')}</dt>
              <dd>{delivery}</dd>
            </div>
            <div>
              <dt>{t('availableUnits')}</dt>
              <dd>{project.availableUnitCount}</dd>
            </div>
            <div>
              <dt>{t('payment')}</dt>
              <dd>
                {project.paymentPlans[0]
                  ? `%${project.paymentPlans[0].downPaymentPercent} + ${project.paymentPlans[0].termMonths} ay`
                  : t('salesOffice')}
              </dd>
            </div>
          </dl>
          <LeadDialog projectId={project.id} projectName={project.name} />
          <div className="secondary-actions">
            <CompareToggleButton projectId={project.id} />
            <FavoriteButton projectId={project.id} />
            <ShareProjectButton projectName={project.name} />
          </div>
          <small>{t('priceDisclaimer')}</small>
        </aside>
      </div>
      <section id="units" className="detail-section container">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{t('liveInventory')}</span>
            <h2>{t('unitsTitle')}</h2>
          </div>
          <p>{t('availableTotal', { count: project.availableUnitCount })}</p>
        </div>
        {project.unitTypes.length ? (
          <div className="unit-grid">
            {project.unitTypes.map((unit) => (
              <article className="unit-card" key={unit.roomType}>
                <div>
                  <strong>{unit.roomType}</strong>
                  <span className="badge badge--success">
                    {t('availableCount', { count: unit.availableCount })}
                  </span>
                </div>
                <div className="floor-plan" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <dl>
                  <div>
                    <dt>Net</dt>
                    <dd>
                      {unit.minNetArea}–{unit.maxNetArea} m²
                    </dd>
                  </div>
                  <div>
                    <dt>{t('start')}</dt>
                    <dd>{money.format(Number(unit.startingPrice))}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>{t('unitsPending')}</h3>
            <p>{t('contactForStock')}</p>
          </div>
        )}
      </section>
      <section id="plans" className="detail-section container">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{t('paymentOptions')}</span>
            <h2>{t('paymentPlans')}</h2>
          </div>
          <p>{t('examplePlan')}</p>
        </div>
        <div className="payment-grid">
          {project.paymentPlans.map((plan) => (
            <article
              className={`payment-card ${plan.isRecommended ? 'is-recommended' : ''}`}
              key={plan.id}
            >
              {plan.isRecommended && (
                <span className="badge">{t('recommended')}</span>
              )}
              <h3>{plan.name}</h3>
              <strong>
                {t('downPayment', { percent: plan.downPaymentPercent })}
              </strong>
              <dl>
                <div>
                  <dt>{t('term')}</dt>
                  <dd>
                    {plan.termMonths
                      ? t('months', { count: plan.termMonths })
                      : t('cash')}
                  </dd>
                </div>
                <div>
                  <dt>{t('onDelivery')}</dt>
                  <dd>%{plan.deliveryPercent}</dd>
                </div>
              </dl>
              <PaymentPlanSheet
                plan={plan}
                startingPrice={project.startingPrice}
              />
            </article>
          ))}
        </div>
      </section>
      <section id="location" className="detail-section container">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{t('surroundings')}</span>
            <h2>{t('location')}</h2>
          </div>
        </div>
        <div className="location-panel">
          <div className="location-map" aria-hidden="true">
            <span>{project.name}</span>
          </div>
          <div className="location-readonly">
            <strong>
              {project.district.name}, {project.province.name}
            </strong>
            <span>
              {project.latitude}, {project.longitude}
            </span>
            <p>{t('locationPending')}</p>
          </div>
        </div>
      </section>
      <MobileProjectCta projectId={project.id} />
    </main>
  );
}

export function ProjectGallery({
  project,
  label,
  allPhotos,
  imagePending,
}: {
  project: ProjectDetailModel;
  label: string;
  allPhotos: string;
  imagePending: string;
}) {
  const fallback: ProjectMedia[] = project.heroImageUrl
    ? [
        {
          id: 'hero-image',
          kind: 'IMAGE',
          url: project.heroImageUrl,
          altText: project.name,
        },
      ]
    : [];
  const images = project.media.length ? project.media : fallback;
  const main = images[0];
  const tiles = Array.from({ length: 4 }, (_, index) => images[index + 1]);

  return (
    <section className="project-gallery container" aria-label={label}>
      <div className="gallery-main">
        {main ? (
          <img
            className="gallery-image"
            src={main.url}
            alt={main.altText?.trim() || `${project.name} — ${label}`}
          />
        ) : (
          <span>{imagePending}</span>
        )}
        {images.length > 0 && (
          <span className="gallery-photo-count">
            {allPhotos} · {images.length}
          </span>
        )}
      </div>
      {tiles.map((image, index) => (
        <div
          className={`gallery-tile gallery-tile--${['one', 'two', 'three', 'four'][index]}`}
          key={image?.id ?? `empty-${index}`}
          aria-hidden={image ? undefined : true}
        >
          {image && (
            <img
              className="gallery-image"
              src={image.url}
              alt={image.altText?.trim() || `${project.name} — ${label}`}
              loading="lazy"
            />
          )}
        </div>
      ))}
    </section>
  );
}

function latestFreshness(
  stock: string | null,
  price: string | null,
  locale: string,
  pending: string,
) {
  const latest = [stock, price]
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1);
  if (!latest) return pending;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(latest));
}
