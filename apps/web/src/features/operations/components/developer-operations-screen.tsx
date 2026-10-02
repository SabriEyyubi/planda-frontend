'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  DeveloperLead as Lead,
  DeveloperOverview as Overview,
  DeveloperPaymentPlan as Plan,
  DeveloperProject as Project,
  DeveloperUnit as Unit,
} from '@planda/api-contract';
import {
  allOperationItems,
  type OperationPage,
  operationsRequest,
  type OperationError,
} from '../api/operations-client';
import { useAuthorization } from '@/lib/permissions/authorization-context';
import { useLocale, useTranslations } from 'next-intl';
import { formatProjectPrice } from '@/features/projects/model/project-presentation';

type View = 'overview' | 'projects' | 'inventory' | 'leads' | 'payment-plans';

export function DeveloperOperationsScreen({ view }: { view: View }) {
  const locale = useLocale();
  const { canManageOrganization } = useAuthorization();
  const t = useTranslations('OperationsCore');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [data, setData] = useState<
    Overview | Project[] | Unit[] | Lead[] | Plan[]
  >();
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [feedback, setFeedback] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const requestVersion = useRef(0);
  const [cursor, setCursor] = useState('');
  const [previousCursors, setPreviousCursors] = useState<string[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  function resetPage() {
    requestVersion.current += 1;
    setState('loading');
    setCursor('');
    setPreviousCursors([]);
    setNextCursor(null);
  }

  const selectedProject = projects.find(
    (project) => project.id === (selectedProjectId || projects[0]?.id),
  );
  const canManageSelectedProject = selectedProject
    ? canManageOrganization(selectedProject.developerOrganizationId)
    : false;

  const load = useCallback(async () => {
    const version = ++requestVersion.current;
    setState('loading');
    setFeedback('');
    try {
      if (view === 'overview') {
        const overview = await operationsRequest<Overview>(
          '/developer/overview',
        );
        if (version !== requestVersion.current) return;
        setData(overview);
        setState('ready');
        return;
      }
      const projectResponse =
        view === 'projects'
          ? await operationsRequest<OperationPage<Project> | Project[]>(
              `/developer/projects${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`,
            )
          : await allOperationItems<Project>(
              '/developer/projects',
              operationsRequest,
            );
      if (version !== requestVersion.current) return;
      const availableProjects = Array.isArray(projectResponse)
        ? projectResponse
        : projectResponse.items;
      setProjects(availableProjects);
      setNextCursor(
        !Array.isArray(projectResponse) && projectResponse.pageInfo?.hasNextPage
          ? projectResponse.pageInfo.nextCursor
          : null,
      );
      if (view === 'projects') {
        setData(availableProjects);
        setState('ready');
        return;
      }
      const projectId = selectedProjectId || availableProjects[0]?.id;
      if (!projectId) {
        setData([]);
        setState('ready');
        return;
      }
      if (!selectedProjectId) setSelectedProjectId(projectId);
      const search = new URLSearchParams();
      if (query) search.set('q', query);
      if (status) search.set('status', status);
      if (cursor) search.set('cursor', cursor);
      const suffix = search.size ? `?${search}` : '';
      const path =
        view === 'inventory'
          ? `/developer/projects/${projectId}/units${suffix}`
          : view === 'leads'
            ? `/developer/leads?projectId=${projectId}${search.size ? `&${search}` : ''}`
            : `/developer/projects/${projectId}/payment-plans`;
      const response = await operationsRequest<
        | Unit[]
        | Lead[]
        | Plan[]
        | OperationPage<Unit>
        | OperationPage<Lead>
        | OperationPage<Plan>
      >(path);
      if (version !== requestVersion.current) return;
      setData(Array.isArray(response) ? response : response.items);
      setNextCursor(
        !Array.isArray(response) && response.pageInfo?.hasNextPage
          ? response.pageInfo.nextCursor
          : null,
      );
      setState('ready');
    } catch (error) {
      if (version !== requestVersion.current) return;
      setFeedback(errorMessage(error as OperationError));
      setState('error');
    }
  }, [cursor, query, selectedProjectId, status, view]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => void load());
    return () => {
      cancelAnimationFrame(frame);
      requestVersion.current += 1;
    };
  }, [load]);

  async function mutate(
    path: string,
    method: 'PATCH' | 'DELETE',
    organizationId: string,
    body?: object,
  ) {
    if (!canManageOrganization(organizationId)) {
      setFeedback(t('permissionRequired'));
      return;
    }
    const version = requestVersion.current;
    setFeedback(t('saving'));
    try {
      await operationsRequest(path, {
        method,
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      if (version !== requestVersion.current) return;
      await load();
      if (version + 1 === requestVersion.current) setFeedback(t('saved'));
    } catch (error) {
      if (version !== requestVersion.current) return;
      const operationError = error as OperationError;
      if (operationError.status === 409) await load();
      setFeedback(errorMessage(operationError));
    }
  }

  const heading = {
    overview: [t('overviewEyebrow'), t('overviewTitle')],
    projects: [t('projectsEyebrow'), t('projectsTitle')],
    inventory: [t('inventoryEyebrow'), t('inventoryTitle')],
    leads: [t('leadsEyebrow'), t('leadsTitle')],
    'payment-plans': [t('plansEyebrow'), t('plansTitle')],
  }[view];

  return (
    <section
      className="ops-screen"
      aria-busy={state === 'loading'}
      aria-labelledby={`developer-${view}-title`}
    >
      <div className="ops-heading">
        <div>
          <span className="eyebrow">{heading[0]}</span>
          <h1 id={`developer-${view}-title`}>{heading[1]}</h1>
          <p>{t('liveScope')}</p>
        </div>
        <button
          className="button button--secondary"
          disabled
          title="Dosya sağlayıcısı henüz yapılandırılmadı"
        >
          {t('exportPending')}
        </button>
      </div>
      {view !== 'overview' && view !== 'projects' && projects.length > 0 && (
        <div className="ops-filters">
          <label>
            <span>{t('project')}</span>
            <select
              value={selectedProjectId}
              onChange={(event) => {
                resetPage();
                setSelectedProjectId(event.target.value);
              }}
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
          {(view === 'inventory' || view === 'leads') && (
            <>
              <label>
                <span>{t('search')}</span>
                <input
                  value={query}
                  onChange={(event) => {
                    resetPage();
                    setQuery(event.target.value);
                  }}
                  placeholder={t('searchPlaceholder')}
                />
              </label>
              <label>
                <span>{t('status')}</span>
                <select
                  value={status}
                  onChange={(event) => {
                    resetPage();
                    setStatus(event.target.value);
                  }}
                >
                  <option value="">{t('all')}</option>
                  {(view === 'inventory'
                    ? ['AVAILABLE', 'RESERVED', 'SOLD']
                    : ['NEW', 'CONTACTED', 'QUALIFIED', 'CLOSED']
                  ).map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
            </>
          )}
        </div>
      )}
      {feedback && (
        <p
          className={
            feedback.includes('kaydedildi')
              ? 'success-callout'
              : feedback.includes('Kaydediliyor')
                ? 'privacy-callout'
                : 'warning-callout'
          }
          aria-live="polite"
          aria-atomic="true"
          role="status"
        >
          {feedback}
        </p>
      )}
      {view !== 'overview' &&
        view !== 'projects' &&
        !canManageSelectedProject &&
        state !== 'loading' && (
          <p className="privacy-callout" role="status">
            {t('memberReadonly')}
          </p>
        )}
      {state === 'loading' && (
        <OperationsState title={t('loading')} retry={t('retry')} />
      )}
      {state === 'error' && (
        <OperationsState
          title={t('loadFailed')}
          action={() => void load()}
          retry={t('retry')}
        />
      )}
      {state === 'ready' && (
        <OperationsView
          view={view}
          data={data}
          projectId={selectedProjectId || projects[0]?.id || ''}
          mutate={mutate}
          canManageOrganization={canManageOrganization}
          selectedOrganizationId={
            selectedProject?.developerOrganizationId ?? ''
          }
          emptyText={t('empty')}
          permissionText={t('permissionRequired')}
          locale={locale}
        />
      )}
      {state === 'ready' && (previousCursors.length > 0 || nextCursor) && (
        <nav aria-label="Liste sayfaları" className="inline-actions">
          <button
            type="button"
            disabled={!previousCursors.length}
            onClick={() => {
              requestVersion.current += 1;
              setState('loading');
              setCursor(previousCursors.at(-1) ?? '');
              setPreviousCursors(previousCursors.slice(0, -1));
            }}
          >
            Önceki sayfa
          </button>
          <button
            type="button"
            disabled={!nextCursor}
            onClick={() => {
              requestVersion.current += 1;
              setState('loading');
              setPreviousCursors([...previousCursors, cursor]);
              setCursor(nextCursor ?? '');
            }}
          >
            Sonraki sayfa
          </button>
        </nav>
      )}
      <p className="privacy-callout">
        AI dosya aktarımı ve otomatik yayınlama MVP’de read-only durumdadır;
        hiçbir veri insan onayı olmadan yayınlanmaz.
      </p>
    </section>
  );
}

function OperationsView({
  view,
  data,
  projectId,
  mutate,
  canManageOrganization,
  selectedOrganizationId,
  emptyText,
  permissionText,
  locale,
}: {
  view: View;
  data: Overview | Project[] | Unit[] | Lead[] | Plan[] | undefined;
  projectId: string;
  mutate: (
    path: string,
    method: 'PATCH' | 'DELETE',
    organizationId: string,
    body?: object,
  ) => Promise<void>;
  canManageOrganization: (organizationId?: string) => boolean;
  selectedOrganizationId: string;
  emptyText: string;
  permissionText: string;
  locale: string;
}) {
  if (view === 'overview') {
    const overview = data as Overview | undefined;
    const metrics = overview
      ? [
          ['Toplam proje', overview.projectCount],
          ['Yayındaki proje', overview.publishedProjectCount],
          ['Uygun daire', overview.availableUnitCount],
          ['Yeni talep', overview.newLeadCount],
          ['Güncellenecek proje', overview.staleInventoryProjectCount],
        ]
      : [];
    return (
      <>
        <div className="metric-grid">
          {metrics.map(([label, value]) => (
            <article key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </article>
          ))}
        </div>
        {!metrics.length && (
          <OperationsState title="Özet metrikleri henüz oluşmadı" />
        )}
        {overview && overview.staleInventoryProjectCount > 0 ? (
          <p className="warning-callout">
            {overview.staleInventoryProjectCount} projenin stok verisi 48
            saatten uzun süredir güncellenmedi.
          </p>
        ) : null}
      </>
    );
  }
  const items = Array.isArray(data) ? data : [];
  if (!items.length) return <OperationsState title={emptyText} retry="" />;
  if (view === 'projects') {
    return (
      <OperationsTable
        label="Geliştirici projeleri"
        columns={['Proje', 'Durum', 'Başlangıç', 'Güncelleme', 'Aksiyon']}
        rows={(items as Project[]).map((project) => [
          project.name,
          project.status,
          formatProjectPrice(project.startingPrice, project.currency, locale),
          formatDate(project.updatedAt),
          project.status === 'DRAFT' ? (
            <button
              type="button"
              disabled={!canManageOrganization(project.developerOrganizationId)}
              title={
                canManageOrganization(project.developerOrganizationId)
                  ? undefined
                  : permissionText
              }
              onClick={() =>
                void mutate(
                  `/developer/projects/${project.id}`,
                  'PATCH',
                  project.developerOrganizationId,
                  { status: 'IN_REVIEW', expectedVersion: project.version },
                )
              }
            >
              İncelemeye gönder
            </button>
          ) : (
            <span>Salt okunur</span>
          ),
        ])}
      />
    );
  }
  if (view === 'inventory') {
    return (
      <OperationsTable
        label="Proje stok envanteri"
        columns={[
          'Daire',
          'Blok',
          'Kat',
          'Tip',
          'Net',
          'Fiyat',
          'Durum',
          'Güncellik',
        ]}
        rows={(items as Unit[]).map((unit) => [
          unit.unitNumber,
          unit.block ?? '—',
          unit.floor ?? '—',
          unit.roomType,
          `${unit.netArea} m²`,
          formatProjectPrice(unit.price, unit.currency, locale),
          <select
            key={`unit-status-${unit.id}`}
            aria-label={`${unit.unitNumber} durumu`}
            value={unit.status}
            disabled={!canManageOrganization(selectedOrganizationId)}
            onChange={(event) =>
              void mutate(
                `/developer/projects/${projectId}/units/${unit.id}`,
                'PATCH',
                selectedOrganizationId,
                { status: event.target.value, expectedVersion: unit.version },
              )
            }
          >
            <option>AVAILABLE</option>
            <option>RESERVED</option>
            <option>SOLD</option>
          </select>,
          isStale(unit.updatedAt) ? (
            <span key={`unit-stale-${unit.id}`} className="status-warn">
              48 saati aştı
            </span>
          ) : (
            formatDate(unit.updatedAt)
          ),
        ])}
      />
    );
  }
  if (view === 'leads') {
    return (
      <OperationsTable
        label="Satış talepleri"
        columns={[
          'Müşteri',
          'İletişim',
          'Proje',
          'Daire',
          'Plan / soru',
          'Dil',
          'Geliş',
          'Durum',
        ]}
        rows={(items as Lead[]).map((lead) => [
          lead.fullName,
          <span key={`contact-${lead.id}`}>
            <a href={`tel:${lead.phone}`}>{lead.phone}</a>
            {lead.email && (
              <>
                <br />
                <a href={`mailto:${lead.email}`}>{lead.email}</a>
              </>
            )}
          </span>,
          lead.projectName,
          lead.unitPreference ?? '—',
          <span key={`context-${lead.id}`}>
            <strong>{lead.paymentPlanName ?? 'Plan seçilmedi'}</strong>
            <br />
            {lead.message ?? '—'}
          </span>,
          lead.preferredLanguage,
          formatDate(lead.createdAt),
          <select
            key={`lead-status-${lead.id}`}
            aria-label={`${lead.fullName} durumu`}
            value={lead.status}
            disabled={!canManageOrganization(selectedOrganizationId)}
            onChange={(event) =>
              void mutate(
                `/developer/leads/${lead.id}`,
                'PATCH',
                selectedOrganizationId,
                {
                  status: event.target.value,
                  expectedVersion: lead.version,
                  ...(event.target.value === 'CLOSED'
                    ? { closedReason: 'Developer panel update' }
                    : {}),
                },
              )
            }
          >
            <option>NEW</option>
            <option>CONTACTED</option>
            <option>QUALIFIED</option>
            <option>CLOSED</option>
          </select>,
        ])}
      />
    );
  }
  return (
    <OperationsTable
      label="Proje ödeme planları"
      columns={['Plan', 'Peşinat', 'Vade', 'Teslimde', 'Önerilen', 'Aksiyon']}
      rows={(items as Plan[]).map((plan) => [
        plan.name,
        `%${plan.downPaymentPercent}`,
        `${plan.termMonths} ay`,
        `%${plan.deliveryPercent}`,
        plan.isRecommended ? 'Evet' : 'Hayır',
        <span key={`plan-actions-${plan.id}`} className="inline-actions">
          <button
            type="button"
            disabled={!canManageOrganization(selectedOrganizationId)}
            onClick={() =>
              void mutate(
                `/developer/projects/${projectId}/payment-plans/${plan.id}`,
                'PATCH',
                selectedOrganizationId,
                {
                  isRecommended: !plan.isRecommended,
                  expectedVersion: plan.version,
                },
              )
            }
          >
            {plan.isRecommended ? 'Öneriyi kaldır' : 'Öner'}
          </button>
          <button
            type="button"
            className="danger-link"
            disabled={!canManageOrganization(selectedOrganizationId)}
            onClick={() =>
              void mutate(
                `/developer/projects/${projectId}/payment-plans/${plan.id}`,
                'DELETE',
                selectedOrganizationId,
                { expectedVersion: plan.version },
              )
            }
          >
            Sil
          </button>
        </span>,
      ])}
    />
  );
}

function OperationsTable({
  label,
  columns,
  rows,
}: {
  label: string;
  columns: string[];
  rows: Array<Array<React.ReactNode>>;
}) {
  return (
    <div className="ops-card">
      <div className="data-table" role="table" aria-label={label}>
        <div
          className="data-row data-row--head"
          role="row"
          style={{
            gridTemplateColumns: `repeat(${columns.length}, minmax(8rem, 1fr))`,
          }}
        >
          {columns.map((column) => (
            <b role="columnheader" key={column}>
              {column}
            </b>
          ))}
        </div>
        {rows.map((row, rowIndex) => (
          <div
            className="data-row"
            role="row"
            key={rowIndex}
            style={{
              gridTemplateColumns: `repeat(${columns.length}, minmax(8rem, 1fr))`,
            }}
          >
            {row.map((cell, index) => (
              <span role="cell" key={index}>
                {cell}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function OperationsState({
  title,
  action,
  retry,
}: {
  title: string;
  action?: () => void;
  retry?: string;
}) {
  return (
    <div className="empty-state" role={action ? 'alert' : 'status'}>
      <h2>{title}</h2>
      {action && (
        <button className="button" type="button" onClick={action}>
          {retry}
        </button>
      )}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function isStale(value: string) {
  return Date.now() - new Date(value).getTime() > 48 * 60 * 60 * 1000;
}

function errorMessage(error: OperationError) {
  if (error.status === 409)
    return 'Başka bir kullanıcı veriyi güncelledi. Liste yenilendi; değişikliği tekrar kontrol edin.';
  if (error.status === 403)
    return 'Bu işlem için organizasyon yetkiniz bulunmuyor.';
  return `İşlem tamamlanamadı${error.requestId ? ` (İstek: ${error.requestId})` : ''}.`;
}
